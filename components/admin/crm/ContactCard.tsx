'use client';

import { useState, useEffect } from 'react';
import {
  Phone, Clock, User, CheckCircle, UserX, ShoppingBag,
  Store, Truck, Star, MapPin, ExternalLink, Instagram,
  Facebook, Bike, Car, AlertCircle, ChevronRight,
  Package, DollarSign, CheckSquare, Wifi, WifiOff,
} from 'lucide-react';
import type { WhatsAppConversation } from '@/lib/hooks/useWhatsappConversations';
import { supabase } from '@/lib/supabase/client';

interface ContactCardProps {
  conversation: WhatsAppConversation;
  onCreateOrder?: () => void;
}

// ─── DB types ────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'client' | 'delivery_agent' | 'restaurant';

interface LinkedUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
}

interface RestaurantProfile {
  name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  status: string | null;
  online: boolean | null;
  cuisine_type: string | null;
  delivery_fee: number | null;
  estimated_delivery_time_minutes: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  instagram_url: string | null;
  facebook_url: string | null;
  onboarding_completed: boolean | null;
  business_hours: Record<string, { open: string; close: string; closed?: boolean }> | null;
  business_hours_enabled: boolean | null;
  min_order_amount: number | null;
  address: string | null;
}

interface DeliveryAgentProfile {
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  status: string | null;
  account_state: string | null;
  onboarding_completed: boolean | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  profile_image_url: string | null;
}

interface ClientStats {
  total_orders: number;
  completed_orders: number;
  total_spent: number;
  last_order_at: string | null;
  address: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPhone(phone: string) {
  return phone.replace('@c.us', '').replace('@s.whatsapp.net', '');
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
};

function todayKey() {
  return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = {
    client:         { label: 'Cliente',           cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    restaurant:     { label: 'Socio Cocina',       cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    delivery_agent: { label: 'Socio Repartidor',  cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    admin:          { label: 'Administrador',      cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  }[role];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </h4>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <span className="text-muted-foreground min-w-0 flex-shrink-0">{label}:</span>
      <span className="text-foreground min-w-0 break-words">{value ?? '—'}</span>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-2.5 flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

// ─── Restaurant panel ─────────────────────────────────────────────────────────

function RestaurantPanel({ userId, linkedUser }: { userId: string; linkedUser: LinkedUser }) {
  const [data, setData] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('restaurants')
      .select(`name, logo_url, cover_image_url, status, online, cuisine_type,
               delivery_fee, estimated_delivery_time_minutes, average_rating, total_reviews,
               instagram_url, facebook_url, onboarding_completed,
               business_hours, business_hours_enabled, min_order_amount, address`)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => { setData(data as RestaurantProfile | null); setLoading(false); });
  }, [userId]);

  if (loading) return <p className="text-xs text-muted-foreground">Cargando restaurante...</p>;
  if (!data) return <p className="text-xs text-muted-foreground">Sin perfil de restaurante.</p>;

  const todayHours = data.business_hours?.[todayKey()];
  const isOpenToday = todayHours && !todayHours.closed;

  return (
    <div className="space-y-3">
      {/* Cover / Logo */}
      {data.cover_image_url && (
        <div className="relative h-20 rounded-lg overflow-hidden">
          <img src={data.cover_image_url} alt="cover" className="w-full h-full object-cover" />
          {data.logo_url && (
            <img
              src={data.logo_url}
              alt="logo"
              className="absolute bottom-2 left-2 w-10 h-10 rounded-full border-2 border-white object-cover shadow"
            />
          )}
        </div>
      )}
      {!data.cover_image_url && data.logo_url && (
        <div className="flex items-center gap-3">
          <img src={data.logo_url} alt="logo" className="w-12 h-12 rounded-full object-cover border border-border" />
          <div>
            <p className="font-semibold text-foreground text-sm">{data.name}</p>
            {data.cuisine_type && <p className="text-xs text-muted-foreground">{data.cuisine_type}</p>}
          </div>
        </div>
      )}

      {/* Online status + onboarding */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          data.online
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {data.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {data.online ? 'En línea' : 'Fuera de línea'}
        </span>
        {data.onboarding_completed ? (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" /> Activo
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" /> Onboarding pendiente
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Calificación"
          value={data.average_rating != null ? `⭐ ${data.average_rating.toFixed(1)}` : '—'}
          sub={data.total_reviews != null ? `${data.total_reviews} reseñas` : undefined}
        />
        <StatCard
          label="Envío / Mín."
          value={data.delivery_fee != null ? formatCurrency(data.delivery_fee) : '—'}
          sub={data.min_order_amount != null ? `Mín: ${formatCurrency(data.min_order_amount)}` : undefined}
        />
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        {data.estimated_delivery_time_minutes && (
          <InfoRow icon={Clock} label="ETA" value={`~${data.estimated_delivery_time_minutes} min`} />
        )}
        {data.address && (
          <InfoRow icon={MapPin} label="Dirección" value={data.address} />
        )}
        {data.cuisine_type && (
          <InfoRow icon={Store} label="Tipo" value={data.cuisine_type} />
        )}
      </div>

      {/* Today's schedule */}
      {data.business_hours_enabled && data.business_hours && (
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Horario de hoy</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(data.business_hours).map(([day, hours]) => {
              const isToday = day === todayKey();
              return (
                <div key={day} className={`text-xs ${isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {DAY_LABELS[day] ?? day}:{' '}
                  {hours.closed ? 'Cerrado' : `${hours.open}–${hours.close}`}
                  {isToday && ' ◀'}
                </div>
              );
            })}
          </div>
          {!isOpenToday && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Hoy está cerrado</p>
          )}
        </div>
      )}

      {/* Social links */}
      {(data.instagram_url || data.facebook_url) && (
        <div className="flex gap-2">
          {data.instagram_url && (
            <a
              href={data.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
          )}
          {data.facebook_url && (
            <a
              href={data.facebook_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </a>
          )}
        </div>
      )}

      {/* Admin CTA */}
      <a
        href={`/admin/restaurants`}
        className="w-full py-2 px-3 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <Store className="w-4 h-4" />
        Ver restaurante
        <ChevronRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Delivery Agent panel ─────────────────────────────────────────────────────

function DeliveryAgentPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<DeliveryAgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('delivery_agent_profiles')
      .select(`vehicle_type, vehicle_plate, vehicle_model, vehicle_color,
               status, account_state, onboarding_completed,
               emergency_contact_name, emergency_contact_phone, profile_image_url`)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => { setData(data as DeliveryAgentProfile | null); setLoading(false); });
  }, [userId]);

  if (loading) return <p className="text-xs text-muted-foreground">Cargando perfil...</p>;
  if (!data) return <p className="text-xs text-muted-foreground">Sin perfil de repartidor.</p>;

  const VehicleIcon = data.vehicle_type === 'car' ? Car : Bike;
  const vehicleLabel = data.vehicle_type === 'car' ? 'Auto' : data.vehicle_type === 'bicycle' ? 'Bicicleta' : 'Moto';

  const agentStatusCfg: Record<string, { label: string; cls: string }> = {
    available:   { label: 'Disponible',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    busy:        { label: 'Ocupado',       cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    offline:     { label: 'Desconectado',  cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  };
  const accountStateCfg: Record<string, { label: string; cls: string }> = {
    active:      { label: 'Activa',        cls: 'text-green-600 dark:text-green-400' },
    suspended:   { label: 'Suspendida',    cls: 'text-red-600 dark:text-red-400' },
    pending:     { label: 'Pendiente',     cls: 'text-amber-600 dark:text-amber-400' },
  };
  const statusCfg = agentStatusCfg[data.status ?? 'offline'] ?? agentStatusCfg.offline;
  const accountCfg = accountStateCfg[data.account_state ?? 'pending'] ?? accountStateCfg.pending;

  return (
    <div className="space-y-3">
      {/* Avatar + status */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          {data.profile_image_url ? (
            <img src={data.profile_image_url} alt="agent" className="w-full h-full object-cover" />
          ) : (
            <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          )}
        </div>
        <div className="space-y-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
          {data.onboarding_completed ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Onboarding completo
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3 h-3" /> Onboarding pendiente
            </div>
          )}
        </div>
      </div>

      {/* Account state */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Cuenta:</span>
        <span className={`font-semibold ${accountCfg.cls}`}>{accountCfg.label}</span>
      </div>

      {/* Vehicle info */}
      <div className="bg-muted/40 rounded-lg p-2.5 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">Vehículo</p>
        <div className="flex items-center gap-2 text-sm">
          <VehicleIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{vehicleLabel}</span>
          {data.vehicle_plate && (
            <span className="ml-auto text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
              {data.vehicle_plate}
            </span>
          )}
        </div>
        {(data.vehicle_model || data.vehicle_color) && (
          <p className="text-xs text-muted-foreground pl-6">
            {[data.vehicle_model, data.vehicle_color].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Emergency contact */}
      {(data.emergency_contact_name || data.emergency_contact_phone) && (
        <div className="space-y-1">
          <SectionLabel>Contacto de emergencia</SectionLabel>
          {data.emergency_contact_name && (
            <InfoRow icon={User} label="Nombre" value={data.emergency_contact_name} />
          )}
          {data.emergency_contact_phone && (
            <InfoRow icon={Phone} label="Tel." value={data.emergency_contact_phone} />
          )}
        </div>
      )}

      {/* Admin CTA */}
      <a
        href={`/admin/delivery-agents`}
        className="w-full py-2 px-3 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <Truck className="w-4 h-4" />
        Ver perfil de repartidor
        <ChevronRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Client panel ─────────────────────────────────────────────────────────────

function ClientPanel({ userId, onCreateOrder }: { userId: string; onCreateOrder?: () => void }) {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('client_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('client_profiles')
        .select('address')
        .eq('user_id', userId)
        .maybeSingle(),
    ]).then(([ordersRes, profileRes]) => {
      const orders = ordersRes.data ?? [];
      const completed = orders.filter((o) => o.status === 'delivered');
      const totalSpent = completed.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
      setStats({
        total_orders: orders.length,
        completed_orders: completed.length,
        total_spent: totalSpent,
        last_order_at: orders[0]?.created_at ?? null,
        address: (profileRes.data as { address: string | null } | null)?.address ?? null,
      });
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <p className="text-xs text-muted-foreground">Cargando datos del cliente...</p>;

  return (
    <div className="space-y-3">
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Órdenes" value={String(stats.total_orders)} sub={`${stats.completed_orders} completadas`} />
          <StatCard label="Total gastado" value={formatCurrency(stats.total_spent)} />
        </div>
      )}

      {stats?.last_order_at && (
        <InfoRow icon={Clock} label="Último pedido" value={formatDate(stats.last_order_at)} />
      )}

      {stats?.address && (
        <InfoRow icon={MapPin} label="Dirección" value={stats.address} />
      )}

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContactCard({ conversation, onCreateOrder }: ContactCardProps) {
  const contact = conversation.whatsapp_contacts;
  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    if (!contact) { setUserLoaded(true); return; }

    const fetchUser = (query: ReturnType<typeof supabase.from>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (query as any)
        .select('id, name, email, phone, role')
        .then(({ data }: { data: LinkedUser | null }) => {
          setLinkedUser(data);
          setUserLoaded(true);
        });
    };

    if (contact.user_id) {
      supabase
        .from('users')
        .select('id, name, email, phone, role')
        .eq('id', contact.user_id)
        .maybeSingle()
        .then(({ data }) => {
          setLinkedUser(data as LinkedUser | null);
          setUserLoaded(true);
        });
    } else if (contact.phone) {
      const phone = contact.phone;
      supabase
        .from('users')
        .select('id, name, email, phone, role')
        .or(`phone.eq.${phone},phone.eq.+${phone}`)
        .order('role')
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

  const roleLabel = linkedUser?.role
    ? { client: 'Cliente', restaurant: 'Socio Cocina', delivery_agent: 'Socio Repartidor', admin: 'Admin' }[linkedUser.role]
    : null;

  return (
    <div className="p-4 border border-border rounded-xl bg-card space-y-3">
      {/* Section header */}
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
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">
              {contact?.name || 'Sin nombre'}
            </p>
            {linkedUser && <RoleBadge role={linkedUser.role} />}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {contact?.phone ? formatPhone(contact.phone) : '—'}
          </p>
        </div>
      </div>

      {/* Conversation metadata */}
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Último visto: {formatDate(contact?.last_seen_at ?? null)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Estado conv.:</span>
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
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Bot pausado: {formatDate(conversation.bot_paused_at)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Platform user section */}
      <div>
        <SectionLabel>
          {linkedUser?.role === 'restaurant' ? 'Socio Cocina' :
           linkedUser?.role === 'delivery_agent' ? 'Socio Repartidor' :
           'Cliente en plataforma'}
        </SectionLabel>

        {!userLoaded ? (
          <p className="text-xs text-muted-foreground">Verificando...</p>
        ) : linkedUser ? (
          <div className="space-y-3">
            {/* Linked account row */}
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{linkedUser.name || '—'}</p>
                <p className="text-xs text-muted-foreground truncate">{linkedUser.email}</p>
              </div>
            </div>

            {/* Role-specific panel */}
            {linkedUser.role === 'restaurant' && (
              <RestaurantPanel userId={linkedUser.id} linkedUser={linkedUser} />
            )}
            {linkedUser.role === 'delivery_agent' && (
              <DeliveryAgentPanel userId={linkedUser.id} />
            )}
            {(linkedUser.role === 'client' || linkedUser.role === 'admin') && (
              <ClientPanel userId={linkedUser.id} onCreateOrder={onCreateOrder} />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserX className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs">Sin cuenta registrada</p>
            </div>
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
        )}
      </div>
    </div>
  );
}
