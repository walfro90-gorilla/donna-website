'use client';

import { useState, useEffect } from 'react';
import { Phone, Clock, User, CheckCircle, UserX, ShoppingBag } from 'lucide-react';
import type { WhatsAppConversation } from '@/lib/hooks/useWhatsappConversations';
import { supabase } from '@/lib/supabase/client';

interface ContactCardProps {
  conversation: WhatsAppConversation;
  onCreateOrder?: () => void;
}

interface LinkedUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

function formatPhone(phone: string) {
  return phone.replace('@c.us', '').replace('@s.whatsapp.net', '');
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ContactCard({ conversation, onCreateOrder }: ContactCardProps) {
  const contact = conversation.whatsapp_contacts;
  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // Fetch linked user: first by user_id (explicit link), then by phone (fallback)
  useEffect(() => {
    if (!contact) { setUserLoaded(true); return; }

    if (contact.user_id) {
      // Fast path: linked by user_id
      supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('id', contact.user_id)
        .maybeSingle()
        .then(({ data }) => {
          setLinkedUser(data as LinkedUser | null);
          setUserLoaded(true);
        });
    } else if (contact.phone) {
      // Fallback: try to find user by normalized phone (handles "+52..." prefix)
      const phone = contact.phone;
      supabase
        .from('users')
        .select('id, name, email, phone')
        .or(`phone.eq.${phone},phone.eq.+${phone}`)
        .order('role')  // admin < client < delivery_agent < restaurant
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          setLinkedUser(data as LinkedUser | null);
          setUserLoaded(true);
        });
    } else {
      setUserLoaded(true);
    }
  }, [contact?.user_id, contact?.phone]);

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

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Platform user section */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Cliente en plataforma
        </h4>

        {!userLoaded ? (
          <p className="text-xs text-muted-foreground">Verificando...</p>
        ) : linkedUser ? (
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{linkedUser.name || '—'}</p>
              <p className="text-xs text-muted-foreground truncate">{linkedUser.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserX className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs">Sin cuenta registrada</p>
          </div>
        )}
      </div>

      {/* Create order CTA */}
      {onCreateOrder && (
        <button
          onClick={onCreateOrder}
          className="w-full py-2 px-3 bg-[#e4007c] text-white rounded-lg text-sm font-medium hover:bg-[#c8006e] transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Nueva Orden
        </button>
      )}
    </div>
  );
}
