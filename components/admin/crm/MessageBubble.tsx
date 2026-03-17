'use client';

import { Download, FileText, Play } from 'lucide-react';
import type { WhatsAppMessage } from '@/lib/hooks/useWhatsappMessages';

interface MessageBubbleProps {
  message: WhatsAppMessage;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function AudioPlayer({ src, filename }: { src: string; filename: string | null }) {
  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <Play className="w-4 h-4 flex-shrink-0" />
      <audio controls className="h-8 w-full max-w-[220px]" preload="none">
        <source src={src} />
      </audio>
      <span className="text-xs opacity-70 truncate max-w-[80px]">{filename || 'audio'}</span>
    </div>
  );
}

function DocumentAttachment({ url, filename, mimetype }: { url: string; filename: string | null; mimetype: string | null }) {
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

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${
          isOutbound
            ? 'bg-green-500 text-white rounded-br-sm'
            : 'bg-card border border-border text-foreground rounded-bl-sm'
        }`}
      >
        {/* Media content */}
        {message.type === 'image' && message.media_url && (
          <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
            <img
              src={message.media_url}
              alt={message.media_filename || 'imagen'}
              className="rounded-lg max-w-full max-h-60 object-cover"
              loading="lazy"
            />
          </a>
        )}

        {message.type === 'video' && message.media_url && (
          <div className="mb-1">
            <video
              src={message.media_url}
              controls
              className="rounded-lg max-w-full max-h-48"
              preload="metadata"
            />
          </div>
        )}

        {(message.type === 'audio' || message.type === 'ptt') && message.media_url && (
          <div className="mb-1">
            <AudioPlayer src={message.media_url} filename={message.media_filename} />
          </div>
        )}

        {message.type === 'document' && message.media_url && (
          <div className="mb-1">
            <DocumentAttachment
              url={message.media_url}
              filename={message.media_filename}
              mimetype={message.media_mimetype}
            />
          </div>
        )}

        {/* Text body */}
        {message.body && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.body}
          </p>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1 text-right ${isOutbound ? 'text-green-100' : 'text-muted-foreground'}`}>
          {formatTime(message.created_at)}
          {isOutbound && (
            <span className="ml-1">
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// Date separator between messages
export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground px-2">{formatDate(date)}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
