'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerCrmUser } from '@/app/admin/crm/actions';

interface RegisterUserModalProps {
  contactId: string;
  phone: string;
  defaultName?: string;
  onRegistered: (userId: string, name: string) => void;
  onClose: () => void;
}

export default function RegisterUserModal({
  contactId,
  phone,
  defaultName = '',
  onRegistered,
  onClose,
}: RegisterUserModalProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const { userId, error } = await registerCrmUser({
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
        contactId,
      });

      if (error || !userId) {
        toast.error(error ?? 'Error al registrar cliente');
        return;
      }

      toast.success(`✅ Cliente "${name.trim()}" registrado`);
      onRegistered(userId, name.trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#e4007c]" />
            <h2 className="font-semibold text-foreground">Registrar nuevo cliente</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Phone — readonly */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Teléfono WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              readOnly
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nombre <span className="text-[#e4007c]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo del cliente"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition"
            />
          </div>

          {/* Email — optional */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Si no se proporciona, se asignará un email interno temporal.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#e4007c] text-white hover:bg-[#c8006e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Registrar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
