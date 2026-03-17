'use client';

import { MessageCircle } from 'lucide-react';
import ConversationList from '@/components/admin/crm/ConversationList';

export default function AdminCRMPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar: conversation list */}
      <div className="w-80 flex-shrink-0">
        <ConversationList />
      </div>

      {/* Empty state when no conversation selected */}
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 text-center px-8">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">WhatsApp CRM</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Selecciona una conversación de la lista para ver los mensajes, responder y controlar el bot de Clawbot.
        </p>
      </div>
    </div>
  );
}
