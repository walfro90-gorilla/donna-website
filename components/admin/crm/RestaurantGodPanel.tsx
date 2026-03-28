'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Zap, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle,
  Percent, DollarSign, Clock, Phone, MapPin, Instagram, Facebook,
  Globe, FileText, Star, Package, ToggleLeft, ToggleRight,
  ChevronRight, Loader2, Save, Edit2, BarChart2, ShoppingBag,
  Utensils, Calendar, ExternalLink, AlertCircle, TrendingUp,
  Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  toggleRestaurantOnline,
  updateRestaurantCommission,
  updateRestaurantStatus,
  toggleProductAvailability,
  updateRestaurantInfo,
} from '@/app/admin/restaurants/actions';
import { BusinessHoursEditor } from '@/app/admin/restaurants/components/BusinessHoursEditor';
import type { BusinessHours } from '@/app/admin/restaurants/components/BusinessHoursEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullRestaurant {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  status: string;
  online: boolean;
  average_rating: number;
  total_reviews: number;
  cuisine_type: string | null;
  delivery_fee: number;
  min_order_amount: number;
  estimated_delivery_time_minutes: number;
  commission_bps: number;
  delivery_radius_km: number;
  business_hours: BusinessHours | null;
  business_hours_enabled: boolean;
  timezone: string;
  phone: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  onboarding_completed: boolean;
  profile_completion_percentage: number;
  business_permit_url: string | null;
  health_permit_url: string | null;
  facade_image_url: string | null;
  menu_image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  type: string;
  product_modifier_groups: { modifier_group_id: string }[];
}

interface FinancialData {
  balance: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  recentOrders: {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    delivery_fee: number;
  }[];
}

type Tab = 'general' | 'menu' | 'horarios' | 'finanzas';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function platformPrice(basePrice: number, commissionBps: number) {
  return basePrice * (1 + commissionBps / 10000);
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Aprobado',  cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  pending:  { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const ORDER_STATUS_CFG: Record<string, string> = {
  delivered:  'text-green-600 dark:text-green-400',
  cancelled:  'text-red-500 dark:text-red-400',
  pending:    'text-amber-600 dark:text-amber-400',
  confirmed:  'text-blue-600 dark:text-blue-400',
  preparing:  'text-indigo-600 dark:text-indigo-400',
  on_the_way: 'text-purple-600 dark:text-purple-400',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  delivered:  'Entregado',
  cancelled:  'Cancelado',
  pending:    'Pendiente',
  confirmed:  'Confirmado',
  preparing:  'Preparando',
  on_the_way: 'En camino',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-[#e4007c]/10 text-[#e4007c] dark:bg-[#e4007c]/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function GodSwitch({ checked, onChange, loading, label, sub }: {
  checked: boolean; onChange: () => void; loading?: boolean; label: string; sub?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        } ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function GeneralTab({ r, onUpdate }: { r: FullRestaurant; onUpdate: (patch: Partial<FullRestaurant>) => void }) {
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionBps, setCommissionBps] = useState(r.commission_bps);
  const [savingCommission, setSavingCommission] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [info, setInfo] = useState({
    delivery_fee: r.delivery_fee,
    min_order_amount: r.min_order_amount,
    estimated_delivery_time_minutes: r.estimated_delivery_time_minutes,
    phone: r.phone ?? '',
    cuisine_type: r.cuisine_type ?? '',
  });
  const [savingInfo, setSavingInfo] = useState(false);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    const { error } = await toggleRestaurantOnline(r.id, !r.online);
    setTogglingOnline(false);
    if (!error) onUpdate({ online: !r.online });
  };

  const handleSaveCommission = async () => {
    setSavingCommission(true);
    const { error } = await updateRestaurantCommission(r.id, commissionBps);
    setSavingCommission(false);
    if (!error) { onUpdate({ commission_bps: commissionBps }); setEditingCommission(false); }
  };

  const handleStatus = async (status: 'approved' | 'pending' | 'rejected') => {
    setSavingStatus(true);
    const { error } = await updateRestaurantStatus(r.id, status);
    setSavingStatus(false);
    if (!error) onUpdate({ status });
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    const { error } = await updateRestaurantInfo(r.id, {
      delivery_fee: info.delivery_fee,
      min_order_amount: info.min_order_amount,
      estimated_delivery_time_minutes: info.estimated_delivery_time_minutes,
      phone: info.phone || undefined,
      cuisine_type: info.cuisine_type || undefined,
    });
    setSavingInfo(false);
    if (!error) {
      onUpdate({ ...info, phone: info.phone || null, cuisine_type: info.cuisine_type || null });
      setEditingInfo(false);
    }
  };

  const commissionPct = (r.commission_bps / 100).toFixed(1);
  const editCommissionPct = (commissionBps / 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* ⚡ God Controls */}
      <div className="rounded-xl border border-[#e4007c]/30 bg-[#e4007c]/5 dark:bg-[#e4007c]/10 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-[#e4007c]" />
          <span className="text-sm font-bold text-[#e4007c] uppercase tracking-wide">God Controls</span>
        </div>

        {/* Online toggle */}
        <GodSwitch
          checked={r.online}
          onChange={handleToggleOnline}
          loading={togglingOnline}
          label="Estado Online"
          sub={r.online ? 'Visible para clientes' : 'Oculto para clientes'}
        />

        {/* Status */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Estado de cuenta</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CFG[r.status]?.cls ?? ''}`}>
              {STATUS_CFG[r.status]?.label ?? r.status}
            </span>
          </div>
          <div className="flex gap-2">
            {(['approved', 'pending', 'rejected'] as const).map((s) => (
              <button
                key={s}
                disabled={savingStatus || r.status === s}
                onClick={() => handleStatus(s)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  r.status === s
                    ? 'bg-foreground/10 border-foreground/20 text-foreground/50 cursor-default'
                    : s === 'approved'
                    ? 'border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : s === 'rejected'
                    ? 'border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                }`}
              >
                {STATUS_CFG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Commission */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-[#e4007c]" />
              <p className="text-sm font-medium text-foreground">Comisión plataforma</p>
            </div>
            <button
              onClick={() => setEditingCommission(!editingCommission)}
              className="text-xs text-[#e4007c] hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              {editingCommission ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editingCommission ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={3000}
                  step={50}
                  value={commissionBps}
                  onChange={(e) => setCommissionBps(Number(e.target.value))}
                  className="flex-1 accent-[#e4007c]"
                />
                <span className="text-lg font-bold text-[#e4007c] w-16 text-right">
                  {editCommissionPct}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{commissionBps} bps</p>
              <button
                onClick={handleSaveCommission}
                disabled={savingCommission}
                className="w-full py-1.5 bg-[#e4007c] text-white rounded-lg text-xs font-medium hover:bg-[#c8006e] flex items-center justify-center gap-1"
              >
                {savingCommission ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Guardar comisión
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{commissionPct}%</span>
              <span className="text-sm text-muted-foreground mb-1">{r.commission_bps} bps</span>
            </div>
          )}
        </div>
      </div>

      {/* Info operacional */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Info operacional</h4>
          <button
            onClick={() => setEditingInfo(!editingInfo)}
            className="text-xs text-[#e4007c] hover:underline flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            {editingInfo ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editingInfo ? (
          <div className="space-y-2.5">
            {[
              { label: 'Costo de envío (MXN)', key: 'delivery_fee', type: 'number' },
              { label: 'Mínimo de pedido (MXN)', key: 'min_order_amount', type: 'number' },
              { label: 'Tiempo estimado (min)', key: 'estimated_delivery_time_minutes', type: 'number' },
              { label: 'Teléfono', key: 'phone', type: 'text' },
              { label: 'Tipo de cocina', key: 'cuisine_type', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  type={type}
                  value={(info as Record<string, string | number>)[key]}
                  onChange={(e) => setInfo(prev => ({
                    ...prev,
                    [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                  }))}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#e4007c]/30"
                />
              </div>
            ))}
            <button
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="w-full py-1.5 bg-[#e4007c] text-white rounded-lg text-xs font-medium hover:bg-[#c8006e] flex items-center justify-center gap-1"
            >
              {savingInfo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Guardar cambios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: DollarSign, label: 'Envío',    value: fmt(r.delivery_fee) },
              { icon: DollarSign, label: 'Mínimo',   value: fmt(r.min_order_amount) },
              { icon: Clock,      label: 'ETA',       value: `~${r.estimated_delivery_time_minutes} min` },
              { icon: Utensils,   label: 'Cocina',    value: r.cuisine_type ?? '—' },
              { icon: Phone,      label: 'Teléfono',  value: r.phone ?? '—' },
              { icon: MapPin,     label: 'Dirección', value: r.address?.slice(0, 30) ?? '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Social + docs */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground mb-3">Links y documentos</h4>
        {[
          { icon: Instagram, label: 'Instagram', url: r.instagram_url },
          { icon: Facebook,  label: 'Facebook',  url: r.facebook_url },
          { icon: Globe,     label: 'Website',   url: r.website_url },
          { icon: FileText,  label: 'Permiso comercial', url: r.business_permit_url },
          { icon: FileText,  label: 'Permiso sanitario',  url: r.health_permit_url },
        ].map(({ icon: Icon, label, url }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            {url ? (
              <a href={url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-[#e4007c] hover:underline">
                Abrir <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">No registrado</span>
            )}
          </div>
        ))}
      </div>

      {/* Completion */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Perfil completado</span>
          <span className="text-sm font-bold text-foreground">{r.profile_completion_percentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#e4007c] to-purple-500 transition-all"
            style={{ width: `${r.profile_completion_percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Onboarding: {r.onboarding_completed ? '✅ Completado' : '⏳ Pendiente'}
        </p>
      </div>
    </div>
  );
}

function MenuTab({ restaurantId, commissionBps }: { restaurantId: string; commissionBps: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, description, price, image_url, is_available, type, product_modifier_groups(modifier_group_id)')
      .eq('restaurant_id', restaurantId)
      .order('type')
      .then(({ data }) => {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, [restaurantId]);

  const handleToggle = async (product: Product) => {
    setTogglingId(product.id);
    const { error } = await toggleProductAvailability(product.id, !product.is_available);
    setTogglingId(null);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-[#e4007c]" />
    </div>
  );

  if (!products.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Package className="w-8 h-8 mb-2" />
      <p className="text-sm">Sin productos registrados</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Commission legend */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e4007c]/5 border border-[#e4007c]/20">
        <Percent className="w-4 h-4 text-[#e4007c]" />
        <p className="text-xs text-muted-foreground">
          Comisión: <span className="font-semibold text-[#e4007c]">{(commissionBps / 100).toFixed(1)}%</span>
          {' '}— Precio plataforma = precio cocina × {(1 + commissionBps / 10000).toFixed(4)}
        </p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <span>Producto</span>
        <span className="text-right">Cocina</span>
        <span className="text-right">Plataforma</span>
        <span className="text-center">Activo</span>
      </div>

      {products.map((p) => {
        const platformPx = platformPrice(Number(p.price), commissionBps);
        const isToggling = togglingId === p.id;
        return (
          <div
            key={p.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-3 rounded-xl border transition-all ${
              p.is_available
                ? 'border-border bg-card'
                : 'border-border/50 bg-muted/30 opacity-60'
            }`}
          >
            {/* Name + image */}
            <div className="flex items-center gap-2 min-w-0">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground capitalize">{p.type}</span>
                  {p.product_modifier_groups.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                      +{p.product_modifier_groups.length} extras
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cocina price */}
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{fmt(Number(p.price))}</p>
              <p className="text-xs text-muted-foreground">cocina</p>
            </div>

            {/* Platform price */}
            <div className="text-right">
              <p className="text-sm font-semibold text-[#e4007c]">{fmt(platformPx)}</p>
              <p className="text-xs text-muted-foreground">plataforma</p>
            </div>

            {/* Toggle */}
            <div className="flex justify-center">
              <button
                onClick={() => handleToggle(p)}
                disabled={isToggling}
                className="transition-all"
                title={p.is_available ? 'Desactivar' : 'Activar'}
              >
                {isToggling ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : p.is_available ? (
                  <ToggleRight className="w-6 h-6 text-green-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorariosTab({ r, onUpdate }: { r: FullRestaurant; onUpdate: (patch: Partial<FullRestaurant>) => void }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-muted/40 border border-border">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Horarios de atención</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Zona horaria: <span className="font-medium">{r.timezone}</span>
        </p>
      </div>
      <BusinessHoursEditor
        restaurantId={r.id}
        initialHours={r.business_hours}
        initialEnabled={r.business_hours_enabled}
        timezone={r.timezone}
        onSaved={(hours, enabled) => onUpdate({ business_hours: hours, business_hours_enabled: enabled })}
      />
    </div>
  );
}

function FinanzasTab({ restaurantId, userId }: { restaurantId: string; userId: string }) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('orders')
        .select('id, status, total_amount, delivery_fee, created_at')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false }),
    ]).then(([accountRes, ordersRes]) => {
      const orders = ordersRes.data ?? [];
      const completed = orders.filter(o => o.status === 'delivered');
      const cancelled = orders.filter(o => o.status === 'cancelled');
      const totalRevenue = completed.reduce((s, o) => s + Number(o.total_amount), 0);
      setData({
        balance: Number(accountRes.data?.balance ?? 0),
        totalOrders: orders.length,
        completedOrders: completed.length,
        cancelledOrders: cancelled.length,
        totalRevenue,
        recentOrders: orders.slice(0, 8),
      });
      setLoading(false);
    });
  }, [restaurantId, userId]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-[#e4007c]" />
    </div>
  );

  if (!data) return null;

  const avgTicket = data.completedOrders > 0 ? data.totalRevenue / data.completedOrders : 0;

  return (
    <div className="space-y-4">
      {/* Saldo */}
      <div className="rounded-xl border border-[#e4007c]/30 bg-gradient-to-br from-[#e4007c]/10 to-purple-500/5 p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Saldo en cuenta</p>
        <p className="text-3xl font-bold text-foreground">{fmt(data.balance)}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: ShoppingBag,  label: 'Total órdenes',    value: String(data.totalOrders) },
          { icon: CheckCircle,  label: 'Entregadas',        value: String(data.completedOrders) },
          { icon: TrendingUp,   label: 'Revenue total',     value: fmt(data.totalRevenue) },
          { icon: BarChart2,    label: 'Ticket promedio',   value: fmt(avgTicket) },
          { icon: XCircle,      label: 'Canceladas',        value: String(data.cancelledOrders) },
          { icon: Percent,      label: 'Tasa completadas',  value: data.totalOrders > 0 ? `${((data.completedOrders / data.totalOrders) * 100).toFixed(0)}%` : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-base font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      {data.recentOrders.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Órdenes recientes
            </p>
          </div>
          <div className="divide-y divide-border">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className={`text-xs font-medium ${ORDER_STATUS_CFG[o.status] ?? 'text-foreground'}`}>
                    {ORDER_STATUS_LABEL[o.status] ?? o.status}
                  </p>
                  <p className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{fmt(Number(o.total_amount))}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface RestaurantGodPanelProps {
  restaurantId: string;
  onClose: () => void;
}

export default function RestaurantGodPanel({ restaurantId, onClose }: RestaurantGodPanelProps) {
  const [restaurant, setRestaurant] = useState<FullRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()
      .then(({ data }) => {
        setRestaurant(data as FullRestaurant | null);
        setLoading(false);
      });
  }, [restaurantId]);

  const handleUpdate = useCallback((patch: Partial<FullRestaurant>) => {
    setRestaurant(prev => prev ? { ...prev, ...patch } : null);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const content = (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — slides in from right */}
      <div className="relative ml-auto w-full max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-border">
          {/* Cover */}
          {restaurant?.cover_image_url && (
            <div className="relative h-24 overflow-hidden">
              <img
                src={restaurant.cover_image_url}
                alt="cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}

          <div className="flex items-start gap-3 p-4">
            {/* Logo */}
            <div className={`flex-shrink-0 ${restaurant?.cover_image_url ? '-mt-8 relative z-10' : ''}`}>
              {restaurant?.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt="logo"
                  className="w-14 h-14 rounded-xl object-cover border-2 border-background shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Utensils className="w-7 h-7 text-orange-500" />
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground truncate">
                  {restaurant?.name ?? '…'}
                </h2>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#e4007c]" />
                  <span className="text-xs font-bold text-[#e4007c] uppercase">God Mode</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {restaurant && (
                  <>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CFG[restaurant.status]?.cls ?? ''}`}>
                      {STATUS_CFG[restaurant.status]?.label}
                    </span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      restaurant.online
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {restaurant.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {restaurant.online ? 'En línea' : 'Offline'}
                    </span>
                    {restaurant.average_rating > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {Number(restaurant.average_rating).toFixed(1)} ({restaurant.total_reviews})
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
            {([
              { id: 'general',  icon: Zap,       label: 'General' },
              { id: 'menu',     icon: Utensils,  label: 'Menú' },
              { id: 'horarios', icon: Clock,     label: 'Horarios' },
              { id: 'finanzas', icon: DollarSign, label: 'Finanzas' },
            ] as { id: Tab; icon: React.ElementType; label: string }[]).map((t) => (
              <TabButton
                key={t.id}
                active={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                icon={t.icon}
                label={t.label}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#e4007c]" />
            </div>
          ) : !restaurant ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">No se pudo cargar el restaurante</p>
            </div>
          ) : (
            <>
              {activeTab === 'general'  && <GeneralTab  r={restaurant} onUpdate={handleUpdate} />}
              {activeTab === 'menu'     && <MenuTab restaurantId={restaurant.id} commissionBps={restaurant.commission_bps} />}
              {activeTab === 'horarios' && <HorariosTab r={restaurant} onUpdate={handleUpdate} />}
              {activeTab === 'finanzas' && <FinanzasTab restaurantId={restaurant.id} userId={restaurant.user_id} />}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border px-4 py-3 flex items-center justify-between">
          <a
            href={`/admin/restaurants/${restaurantId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir página completa
          </a>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar panel
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}
