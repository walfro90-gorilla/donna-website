'use client';

import Link from 'next/link';
import { Bot, BotOff, User } from 'lucide-react';
import type { WhatsAppConversation } from '@/lib/hooks/useWhatsappConversations';

interface ConversationItemProps {
  conversation: WhatsAppConversation;
  isActive?: boolean;
}

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ConversationItem({ conversation, isActive }: ConversationItemProps) {
  const contact = conversation.whatsapp_contacts;
  const displayName = contact?.name || contact?.phone?.replace('@c.us', '') || 'Desconocido';

  return (
    <Link
      href={`/admin/crm/${conversation.id}`}
      className={`flex items-start gap-3 px-3 py-3 hover:bg-muted/60 transition-colors border-b border-border cursor-pointer ${
        isActive ? 'bg-muted' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {contact?.profile_photo_url ? (
          <img src={contact.profile_photo_url} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <User className="w-5 h-5 text-green-600 dark:text-green-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-medium text-sm text-foreground truncate">{displayName}</span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">
            {timeAgo(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-muted-foreground truncate flex-1">
            {conversation.last_message_preview || 'Sin mensajes'}
          </p>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Bot indicator */}
            {conversation.bot_active ? (
              <Bot className="w-3.5 h-3.5 text-green-500" aria-label="Bot activo" />
            ) : (
              <BotOff className="w-3.5 h-3.5 text-orange-500" aria-label="Bot pausado" />
            )}

            {/* Unread badge */}
            {conversation.unread_count > 0 && (
              <span className="bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
