'use client';

import { useState } from 'react';
import { Bot, BotOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BotToggleProps {
  conversationId: string;
  botActive: boolean;
  onToggle: (newValue: boolean) => void;
}

export default function BotToggle({ conversationId, botActive, onToggle }: BotToggleProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const newValue = !botActive;
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/conversations/${conversationId}/bot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_active: newValue }),
      });

      if (!res.ok) throw new Error('Error al cambiar estado del bot');

      onToggle(newValue);
      toast.success(newValue ? 'Bot reactivado — Clawbot responderá automáticamente' : 'Bot pausado — modo asesor activo');
    } catch {
      toast.error('No se pudo cambiar el estado del bot');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-border rounded-xl bg-card space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Control del Bot
      </h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {botActive ? (
            <Bot className="w-5 h-5 text-green-500" />
          ) : (
            <BotOff className="w-5 h-5 text-orange-500" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {botActive ? 'Bot activo' : 'Bot pausado'}
            </p>
            <p className="text-xs text-muted-foreground">
              {botActive
                ? 'Clawbot responde automáticamente'
                : 'Asesor tomó el control'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 ${
            botActive
              ? 'bg-green-500'
              : 'bg-orange-400'
          } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
              botActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
          {loading && (
            <Loader2 className="absolute right-1 w-3 h-3 text-white animate-spin" />
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {botActive
          ? 'Desactiva el bot para atender manualmente esta conversación. Clawbot dejará de responder en este chat.'
          : 'El bot está pausado. Reactívalo cuando termines de atender al cliente.'}
      </p>
    </div>
  );
}
