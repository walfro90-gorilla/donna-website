'use client';

import { use, useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConversationList from '@/components/admin/crm/ConversationList';
import ChatWindow from '@/components/admin/crm/ChatWindow';
import SendMessageForm from '@/components/admin/crm/SendMessageForm';
import BotToggle from '@/components/admin/crm/BotToggle';
import ContactCard from '@/components/admin/crm/ContactCard';
import { useWhatsappMessages } from '@/lib/hooks/useWhatsappMessages';
import { useWhatsappConversations, markConversationRead } from '@/lib/hooks/useWhatsappConversations';
import { supabase } from '@/lib/supabase/client';
import type { WhatsAppConversation } from '@/lib/hooks/useWhatsappConversations';

export default function CRMConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const router = useRouter();

  // Fetch all conversations (for the sidebar)
  const { data: conversations, mutate: mutateConversations } = useWhatsappConversations('all');

  // Find current conversation
  const [conversation, setConversation] = useState<WhatsAppConversation | null>(null);

  useEffect(() => {
    if (!conversations) return;
    const found = conversations.find((c) => c.id === conversationId) ?? null;
    setConversation(found);
  }, [conversations, conversationId]);

  // Fetch messages + Realtime
  const { messages, isLoading } = useWhatsappMessages(conversationId);

  // Mark as read on open
  useEffect(() => {
    if (conversationId) {
      markConversationRead(conversationId).then(() => mutateConversations());
    }
  }, [conversationId, mutateConversations]);

  // Realtime: update conversation when bot_active or status changes
  useEffect(() => {
    const channel = supabase
      .channel(`wa-conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `id=eq.${conversationId}`,
        },
        () => {
          mutateConversations();
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [conversationId, mutateConversations]);

  function handleBotToggle(newValue: boolean) {
    setConversation((prev) => prev ? { ...prev, bot_active: newValue } : prev);
    mutateConversations();
  }

  async function handleResolve() {
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ status: 'resolved' })
      .eq('id', conversationId);

    if (error) {
      toast.error('Error al resolver conversación');
    } else {
      toast.success('Conversación marcada como resuelta');
      mutateConversations();
      router.push('/admin/crm');
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <ConversationList activeConversationId={conversationId} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
          <Link href="/admin/crm" className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {conversation?.whatsapp_contacts?.name
                || conversation?.whatsapp_contacts?.phone?.replace('@c.us', '')
                || 'Cargando...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {conversation?.whatsapp_contacts?.phone?.replace('@c.us', '')}
            </p>
          </div>

          {/* Resolve button */}
          {conversation && conversation.status !== 'resolved' && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolver
            </button>
          )}
        </div>

        {/* Messages */}
        <ChatWindow messages={messages} isLoading={isLoading} />

        {/* Send form */}
        <SendMessageForm
          conversationId={conversationId}
          disabled={conversation?.bot_active === true}
          onMessageSent={() => mutateConversations()}
        />
      </div>

      {/* Right panel: contact info + bot toggle */}
      <div className="w-64 flex-shrink-0 hidden xl:flex flex-col border-l border-border bg-background overflow-y-auto p-3 space-y-3">
        {conversation && (
          <>
            <ContactCard conversation={conversation} />
            <BotToggle
              conversationId={conversationId}
              botActive={conversation.bot_active}
              onToggle={handleBotToggle}
            />
          </>
        )}
      </div>
    </div>
  );
}
