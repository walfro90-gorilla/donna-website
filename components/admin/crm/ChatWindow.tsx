'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import MessageBubble, { DateSeparator } from './MessageBubble';
import type { WhatsAppMessage } from '@/lib/hooks/useWhatsappMessages';

interface ChatWindowProps {
  messages: WhatsAppMessage[];
  isLoading: boolean;
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando mensajes...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
          <span className="text-3xl">💬</span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin mensajes aún</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
      {messages.map((msg, i) => {
        const showDate = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at);
        return (
          <div key={msg.id}>
            {showDate && <DateSeparator date={msg.created_at} />}
            <MessageBubble message={msg} />
          </div>
        );
      })}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
