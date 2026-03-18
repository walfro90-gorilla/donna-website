'use client';

import { use, useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Bot, BotOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConversationList from '@/components/admin/crm/ConversationList';
import ChatWindow from '@/components/admin/crm/ChatWindow';
import SendMessageForm from '@/components/admin/crm/SendMessageForm';
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

  const { data: conversations, mutate: mutateConversations } = useWhatsappConversations('all');
  const [conversation, setConversation] = useState<WhatsAppConversation | null>(null);
  const [botLoading, setBotLoading] = useState(false);

  useEffect(() => {
    if (!conversations) return;
    const found = conversations.find((c) => c.id === conversationId) ?? null;
    setConversation(found);
  }, [conversations, conversationId]);

  const { messages, isLoading } = useWhatsappMessages(conversationId);

  useEffect(() => {
    if (conversationId) {
      markConversationRead(conversationId).then(() => mutateConversations());
    }
  }, [conversationId, mutateConversations]);

  // Realtime conversation updates
  useEffect(() => {
    const channel = supabase
      .channel(`wa-conv-${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_conversations',
        filter: `id=eq.${conversationId}`,
      }, () => { mutateConversations(); })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [conversationId, mutateConversations]);

  async function handleBotToggle() {
    if (!conversation) return;
    const newValue = !conversation.bot_active;
    setBotLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/conversations/${conversationId}/bot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_active: newValue }),
      });
      if (!res.ok) throw new Error();
      setConversation((prev) => prev ? { ...prev, bot_active: newValue } : prev);
      mutateConversations();
      toast.success(newValue ? '🤖 Bot reactivado' : '👤 Modo asesor activo');
    } catch {
      toast.error('No se pudo cambiar el estado del bot');
    } finally {
      setBotLoading(false);
    }
  }

  async function handleResolve() {
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ status: 'resolved' })
      .eq('id', conversationId);
    if (error) {
      toast.error('Error al resolver conversación');
    } else {
      toast.success('Conversación resuelta');
      mutateConversations();
      router.push('/admin/crm');
    }
  }

  const botActive = conversation?.bot_active ?? true;
  const contactName = conversation?.whatsapp_contacts?.name
    || conversation?.whatsapp_contacts?.phone?.replace('@c.us', '').replace('@s.whatsapp.net', '')
    || 'Cargando...';
  const contactPhone = conversation?.whatsapp_contacts?.phone
    ?.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '');

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-100 dark:bg-zinc-900">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 hidden lg:block bg-background border-r border-border">
        <ConversationList activeConversationId={conversationId} />
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shadow-sm">
          <Link href="/admin/crm" className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 text-green-700 dark:text-green-400 font-bold text-sm">
            {contactName.charAt(0).toUpperCase()}
          </div>

          {/* Name + phone */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate leading-tight">{contactName}</p>
            {contactPhone && (
              <p className="text-xs text-muted-foreground leading-tight">+{contactPhone}</p>
            )}
          </div>

          {/* Status badge */}
          {conversation && (
            <span className={`hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${
              conversation.status === 'open'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : conversation.status === 'in_progress'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {conversation.status === 'open' ? 'Abierta'
                : conversation.status === 'in_progress' ? 'En atención'
                : 'Resuelta'}
            </span>
          )}

          {/* Bot toggle button */}
          <button
            onClick={handleBotToggle}
            disabled={botLoading || !conversation}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
              botActive
                ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={botActive ? 'Pausar bot — tomar control manual' : 'Reactivar bot'}
          >
            {botLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : botActive ? (
              <Bot className="w-3.5 h-3.5" />
            ) : (
              <BotOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{botActive ? 'Bot activo' : 'Bot pausado'}</span>
          </button>

          {/* Resolve button */}
          {conversation && conversation.status !== 'resolved' && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resolver</span>
            </button>
          )}
        </div>

        {/* Chat background + messages */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#efeae2] dark:bg-zinc-900">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>

        {/* Send form */}
        <SendMessageForm
          conversationId={conversationId}
          disabled={botActive}
          onMessageSent={() => mutateConversations()}
        />
      </div>

      {/* Right panel */}
      <div className="w-64 flex-shrink-0 hidden xl:flex flex-col border-l border-border bg-background overflow-y-auto p-3 space-y-3">
        {conversation && <ContactCard conversation={conversation} />}
      </div>
    </div>
  );
}
