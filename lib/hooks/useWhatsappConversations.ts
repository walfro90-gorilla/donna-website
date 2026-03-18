import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';

export interface WhatsAppContact {
  id: string;
  phone: string;
  name: string | null;
  profile_photo_url: string | null;
  last_seen_at: string | null;
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

async function fetchConversations(filter: ConversationFilter): Promise<WhatsAppConversation[]> {
  let query = supabase
    .from('whatsapp_conversations')
    .select(`
      *,
      whatsapp_contacts (
        id, phone, name, profile_photo_url, last_seen_at
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
  console.log('[useWhatsappConversations] fetched', data?.length ?? 0, 'conversations');
  return (data ?? []) as WhatsAppConversation[];
}

export function useWhatsappConversations(filter: ConversationFilter = 'all') {
  return useSWR<WhatsAppConversation[]>(
    ['whatsapp-conversations', filter],
    () => fetchConversations(filter),
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  );
}

export async function markConversationRead(conversationId: string) {
  await supabase
    .from('whatsapp_conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId);
}
