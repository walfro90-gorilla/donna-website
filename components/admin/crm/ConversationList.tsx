'use client';

import { useState } from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import ConversationItem from './ConversationItem';
import { useWhatsappConversations, type ConversationFilter } from '@/lib/hooks/useWhatsappConversations';

const FILTERS: { label: string; value: ConversationFilter }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Abiertas', value: 'open' },
  { label: 'En atención', value: 'in_progress' },
  { label: 'Resueltas', value: 'resolved' },
];

interface ConversationListProps {
  activeConversationId?: string;
}

export default function ConversationList({ activeConversationId }: ConversationListProps) {
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [search, setSearch] = useState('');

  const { data: conversations, isLoading, error, mutate } = useWhatsappConversations(filter);

  if (error) {
    console.error('[ConversationList] SWR error:', error);
  }

  const filtered = (conversations ?? []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = c.whatsapp_contacts?.name?.toLowerCase() ?? '';
    const phone = c.whatsapp_contacts?.phone?.toLowerCase() ?? '';
    const preview = c.last_message_preview?.toLowerCase() ?? '';
    return name.includes(q) || phone.includes(q) || preview.includes(q);
  });

  return (
    <div className="flex flex-col h-full border-r border-border bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">WhatsApp CRM</h2>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title="Actualizar"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                filter === f.value
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-2">
            <p className="text-sm text-red-500 font-medium">Error al cargar conversaciones</p>
            <p className="text-xs text-muted-foreground break-all">{String(error?.message ?? error)}</p>
            <button onClick={() => mutate()} className="text-xs text-green-500 hover:underline mt-1">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-sm text-muted-foreground">Sin conversaciones</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-xs text-green-500 hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {filtered.length} conversación{filtered.length !== 1 ? 'es' : ''}
        </p>
      </div>
    </div>
  );
}
