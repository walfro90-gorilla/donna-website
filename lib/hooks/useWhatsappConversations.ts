import useSWR, { mutate as globalMutate } from 'swr';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface WhatsAppContact {
  id: string;
  phone: string;
  name: string | null;
  profile_photo_url: string | null;
  last_seen_at: string | null;
  user_id: string | null;
}

export interface WhatsAppConversation {
  id: string;
  contact_id: string;
  status: 'open' | 'in_progress' | 'resolved';
  bot_active: boolean;
  bot_paused_by: string | null;
  bot_paused_at: string | null;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  whatsapp_contacts: WhatsAppContact | null;
}

export type ConversationFilter = 'all' | 'open' | 'in_progress' | 'resolved';

// ── Realtime singleton ─────────────────────────────────────────────────────
// Prevents duplicate subscriptions when multiple components use this hook
let _channel: RealtimeChannel | null = null;
let _subscribers = 0;
let _lastBeepAt = 0;

function playNotificationBeep() {
  // Debounce: no más de 1 beep por segundo
  const now = Date.now();
  if (now - _lastBeepAt < 1000) return;
  _lastBeepAt = now;

  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // AudioContext not available (SSR / user hasn't interacted yet) — silent fail
  }
}

function revalidateConversations() {
  globalMutate(
    (key: unknown) => Array.isArray(key) && key[0] === 'whatsapp-conversations',
    undefined,
    { revalidate: true }
  );
}

function setupRealtime() {
  if (_channel) return; // singleton: already subscribed

  _channel = supabase
    .channel('wa-crm-global')
    // Conversation inserts / updates → refresh list
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'whatsapp_conversations' },
      () => revalidateConversations()
    )
    // New messages → refresh list preview + sound for inbound
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
      (payload) => {
        const msg = payload.new as { direction: string };
        if (msg.direction === 'inbound') {
          playNotificationBeep();
        }
        revalidateConversations();
      }
    )
    .subscribe((status) => {
      console.log('[CRM Realtime] status:', status);
    });
}

function teardownRealtime() {
  if (_channel) {
    _channel.unsubscribe();
    _channel = null;
  }
}

// ── Fetcher ────────────────────────────────────────────────────────────────

async function fetchConversations(filter: ConversationFilter): Promise<WhatsAppConversation[]> {
  let query = supabase
    .from('whatsapp_conversations')
    .select(`
      *,
      whatsapp_contacts (
        id, phone, name, profile_photo_url, last_seen_at, user_id
      )
    `)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[useWhatsappConversations] Supabase error:', error);
    throw error;
  }
  return (data ?? []) as WhatsAppConversation[];
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useWhatsappConversations(filter: ConversationFilter = 'all') {
  // Mount / unmount the singleton subscription
  useEffect(() => {
    _subscribers++;
    if (_subscribers === 1) setupRealtime();

    return () => {
      _subscribers--;
      if (_subscribers === 0) teardownRealtime();
    };
  }, []);

  return useSWR<WhatsAppConversation[]>(
    ['whatsapp-conversations', filter],
    () => fetchConversations(filter),
    {
      refreshInterval: 60_000,   // fallback polling (Realtime cubre el resto)
      revalidateOnFocus: true,
      dedupingInterval: 3_000,
    }
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

export async function markConversationRead(conversationId: string) {
  await supabase
    .from('whatsapp_conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId);
}
