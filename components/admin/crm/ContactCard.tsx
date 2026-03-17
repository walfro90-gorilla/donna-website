'use client';

import { Phone, Clock, User } from 'lucide-react';
import type { WhatsAppConversation } from '@/lib/hooks/useWhatsappConversations';

interface ContactCardProps {
  conversation: WhatsAppConversation;
}

function formatPhone(phone: string) {
  // Remove @c.us suffix
  return phone.replace('@c.us', '').replace('@s.whatsapp.net', '');
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ContactCard({ conversation }: ContactCardProps) {
  const contact = conversation.whatsapp_contacts;

  return (
    <div className="p-4 border border-border rounded-xl bg-card space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Contacto
      </h3>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          {contact?.profile_photo_url ? (
            <img src={contact.profile_photo_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-green-600 dark:text-green-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">
            {contact?.name || 'Sin nombre'}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {contact?.phone ? formatPhone(contact.phone) : '—'}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Último visto: {formatDate(contact?.last_seen_at ?? null)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Estado:</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            conversation.status === 'open'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : conversation.status === 'in_progress'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {conversation.status === 'open' ? 'Abierta'
              : conversation.status === 'in_progress' ? 'En atención'
              : 'Resuelta'}
          </span>
        </div>

        {conversation.bot_paused_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Bot pausado: {formatDate(conversation.bot_paused_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
