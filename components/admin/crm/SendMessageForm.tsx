'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, X, Loader2, FileText, Image as ImageIcon, Mic } from 'lucide-react';
import toast from 'react-hot-toast';

interface SendMessageFormProps {
  conversationId: string;
  disabled?: boolean;
  onMessageSent?: () => void;
}

const ACCEPTED_TYPES = 'image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export default function SendMessageForm({ conversationId, disabled, onMessageSent }: SendMessageFormProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function fileIcon(f: File) {
    if (f.type.startsWith('image')) return <ImageIcon className="w-4 h-4" />;
    if (f.type.startsWith('audio')) return <Mic className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  }

  async function handleSend() {
    if ((!text.trim() && !file) || sending || disabled) return;

    setSending(true);
    try {
      let mediaBase64: string | undefined;
      let mimetype: string | undefined;
      let filename: string | undefined;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        mediaBase64 = Buffer.from(arrayBuffer).toString('base64');
        mimetype = file.type;
        filename = file.name;
      }

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: text.trim() || undefined,
          mediaBase64,
          mimetype,
          filename,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al enviar');
      }

      setText('');
      setFile(null);
      onMessageSent?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-background p-3 space-y-2">
      {/* File preview */}
      {file && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          {fileIcon(file)}
          <span className="text-sm truncate flex-1">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB
          </span>
          <button
            onClick={() => setFile(null)}
            className="p-0.5 rounded hover:bg-border transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {disabled && (
        <p className="text-xs text-orange-500 px-1">
          El bot está activo. Pausa el bot para responder manualmente.
        </p>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || sending}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
          title="Adjuntar archivo"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Pausa el bot para responder...' : 'Escribe un mensaje... (Enter para enviar)'}
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 max-h-32 leading-relaxed"
          style={{ minHeight: '40px' }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = 'auto';
            t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || sending || disabled}
          className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title="Enviar (Enter)"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
