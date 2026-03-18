'use client';

import { Download, FileText, Bot } from 'lucide-react';
import type { WhatsAppMessage } from '@/lib/hooks/useWhatsappMessages';

interface MessageBubbleProps {
  message: WhatsAppMessage;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

function DocumentAttachment({ url, filename }: { url: string; filename: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors max-w-[240px]"
    >
      <FileText className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm truncate flex-1">{filename || 'documento'}</span>
      <Download className="w-4 h-4 flex-shrink-0 opacity-70" />
    </a>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const isBot = isOutbound && !message.sent_by; // null sent_by = bot
  const isHuman = isOutbound && !!message.sent_by; // has sent_by = human asesor

  // Colors: inbound=white card, bot=blue, human=green
  const bubbleClass = isBot
    ? 'bg-blue-600 text-white rounded-br-sm'
    : isHuman
    ? 'bg-green-500 text-white rounded-br-sm'
    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground rounded-bl-sm shadow-sm';

  const timeClass = isOutbound ? 'text-white/70' : 'text-zinc-400';

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${bubbleClass}`}>
        {/* Bot indicator */}
        {isBot && (
          <div className="flex items-center gap-1 mb-1 opacity-80">
            <Bot className="w-3 h-3" />
            <span className="text-[10px] font-medium">Clawbot</span>
          </div>
        )}

        {/* Media */}
        {message.type === 'image' && message.media_url && (
          <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
            <img
              src={message.media_url}
              alt={message.media_filename || 'imagen'}
              className="rounded-xl max-w-full max-h-60 object-cover"
              loading="lazy"
            />
          </a>
        )}

        {message.type === 'video' && message.media_url && (
          <div className="mb-1.5">
            <video src={message.media_url} controls className="rounded-xl max-w-full max-h-48" preload="metadata" />
          </div>
        )}

        {(message.type === 'audio' || message.type === 'ptt') && message.media_url && (
          <div className="mb-1.5">
            <audio controls className="h-8 w-full max-w-[220px]" preload="none">
              <source src={message.media_url} />
            </audio>
          </div>
        )}

        {message.type === 'document' && message.media_url && (
          <div className="mb-1.5">
            <DocumentAttachment url={message.media_url} filename={message.media_filename} />
          </div>
        )}

        {/* Text */}
        {message.body && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.body}
          </p>
        )}

        {/* Time + status */}
        <p className={`text-[10px] mt-1 text-right ${timeClass}`}>
          {formatTime(message.created_at)}
          {isOutbound && (
            <span className="ml-1 opacity-80">
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 px-2 capitalize">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}
