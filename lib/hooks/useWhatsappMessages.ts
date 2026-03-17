import useSWR from 'swr';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  wa_message_id: string | null;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'ptt' | 'sticker' | 'unknown';
  body: string | null;
  media_url: string | null;
  media_mimetype: string | null;
  media_filename: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_by: string | null;
  created_at: string;
}

async function fetchMessages(conversationId: string): Promise<WhatsAppMessage[]> {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as WhatsAppMessage[];
}

export function useWhatsappMessages(conversationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<WhatsAppMessage[]>(
    conversationId ? ['whatsapp-messages', conversationId] : null,
    () => fetchMessages(conversationId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2_000,
    }
  );

  // Supabase Realtime — append new messages without full refetch
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`wa-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as WhatsAppMessage;
          mutate(
            (current) => [...(current ?? []), newMsg],
            { revalidate: false }
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, mutate]);

  return { messages: data ?? [], error, isLoading, mutate };
}
