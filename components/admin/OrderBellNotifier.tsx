'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell, X, ShoppingBag, ChevronRight } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderNotif {
  id: string;
  orderId: string;
  restaurantName: string;
  total: number;
  paymentMethod: string | null;
  createdAt: string;
}

// ─── Web Audio bell ───────────────────────────────────────────────────────────
// Generates a bell chime with harmonics — no audio file needed.

function playBellChime(ctx: AudioContext) {
  // Two-strike bell: first hit + softer echo
  const strikes = [
    { delay: 0,    gainScale: 1 },
    { delay: 0.18, gainScale: 0.45 },
  ];

  const tones = [
    { freq: 1046.5, gain: 0.35 }, // C6 — fundamental
    { freq: 1318.5, gain: 0.22 }, // E6 — major third
    { freq: 1568,   gain: 0.14 }, // G6 — fifth
    { freq: 2093,   gain: 0.08 }, // C7 — octave
  ];

  strikes.forEach(({ delay, gainScale }) => {
    tones.forEach(({ freq, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      const startGain = gain * gainScale;
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(startGain, ctx.currentTime + delay + 0.004);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 2.2);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 2.5);
    });
  });
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({ notif, onDismiss }: { notif: OrderNotif; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Auto-dismiss after 10s
  useEffect(() => {
    const t = setTimeout(() => dismiss(), 10_000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(() => onDismiss(notif.id), 350);
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  const paymentLabel = notif.paymentMethod === 'cash' ? 'Efectivo'
    : notif.paymentMethod === 'spei' ? 'SPEI'
    : notif.paymentMethod ?? '—';

  return (
    <div
      className={`
        w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
        rounded-2xl shadow-2xl overflow-hidden
        transition-all duration-350 ease-out
        ${visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Pink top bar */}
      <div className="h-1 bg-gradient-to-r from-[#e4007c] to-purple-500" />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Animated bell icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#e4007c]/10 flex items-center justify-center animate-[wiggle_0.6s_ease-in-out]">
            <Bell className="w-5 h-5 text-[#e4007c] fill-[#e4007c]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                ¡Nueva orden!
              </p>
              <button
                onClick={dismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              🏪 {notif.restaurantName}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-extrabold text-[#e4007c]">
                {fmt(notif.total)}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                {paymentLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Action link */}
        <a
          href={`/admin/orders/${notif.orderId}`}
          onClick={dismiss}
          className="mt-3 w-full flex items-center justify-between px-3 py-2 bg-[#e4007c]/5 hover:bg-[#e4007c]/10 border border-[#e4007c]/20 rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-[#e4007c]" />
            <span className="text-xs font-semibold text-[#e4007c]">Ver orden</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#e4007c] group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Progress bar countdown */}
      <div className="h-0.5 bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full bg-[#e4007c]/40 animate-[shrink_10s_linear_forwards]"
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
}

// ─── Global notifier ──────────────────────────────────────────────────────────

export default function OrderBellNotifier() {
  const [notifs, setNotifs] = useState<OrderNotif[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Track the timestamp when the component mounts to ignore pre-existing orders
  const mountTimeRef = useRef<string>(new Date().toISOString());

  const dismiss = useCallback((id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  // Unlock AudioContext on first user interaction (browser autoplay policy)
  useEffect(() => {
    function unlock() {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Supabase Realtime subscription
  useEffect(() => {
    channelRef.current = supabase
      .channel('global-order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const order = payload.new as {
            id: string;
            restaurant_id: string;
            total_amount: number;
            payment_method: string | null;
            status: string;
            is_test: boolean;
            created_at: string;
          };

          // Ignore test orders, non-pending orders, and orders from before mount
          if (order.is_test) return;
          if (order.status !== 'pending') return;
          if (order.created_at < mountTimeRef.current) return;

          // Fetch restaurant name
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('name')
            .eq('id', order.restaurant_id)
            .maybeSingle();

          // Play bell
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') await ctx.resume();
          playBellChime(ctx);

          // Add notification
          setNotifs(prev => [
            {
              id: `${order.id}-${Date.now()}`,
              orderId: order.id,
              restaurantName: restaurant?.name ?? 'Restaurante',
              total: Number(order.total_amount),
              paymentMethod: order.payment_method,
              createdAt: order.created_at,
            },
            ...prev.slice(0, 4), // max 5 stacked
          ]);
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  if (!notifs.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifs.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotifCard notif={n} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
