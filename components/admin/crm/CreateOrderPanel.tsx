'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  X, ChevronRight, ChevronLeft, User, Store, ShoppingBag,
  MapPin, CheckCircle, Loader2, Plus, Minus, Search,
  Clock, Truck, UserCheck, UserX, AlertTriangle, Banknote, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import type { WhatsAppConversation } from '@/lib/hooks/useWhatsappConversations';
import {
  searchUserByPhone, linkContactToUser, createManualOrder,
  type CrmUser, type OrderItem, type OrderItemModifier,
} from '@/app/admin/crm/actions';
import RegisterUserModal from './RegisterUserModal';

// ── Types ────────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  logo_url: string | null;
  cuisine_type: string | null;
  delivery_fee: number;
  estimated_delivery_time_minutes: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  image_url: string | null;
}

interface ModifierOption {
  id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  selection_type: 'single' | 'multiple';
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  sort_order: number;
  modifiers: ModifierOption[];
}

interface SelectedModifier {
  modifierId: string;
  modifierGroupId: string;
  name: string;
  groupName: string;
  priceDelta: number;
}

interface CartLine {
  lineKey: string;
  product: Product;
  quantity: number;
  modifiers: SelectedModifier[];
  effectivePrice: number;
}

interface CoverageZone {
  center_lat: number;
  center_lon: number;
  radius_km: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  return raw.split('@')[0].trim();
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeLineKey(productId: string, modifiers: SelectedModifier[]): string {
  const modKey = [...modifiers]
    .sort((a, b) => a.modifierId.localeCompare(b.modifierId))
    .map((m) => m.modifierId)
    .join(',');
  return `${productId}:${modKey}`;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Cliente', 'Restaurante', 'Productos', 'Dirección', 'Resumen'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 px-5 py-3 border-b border-border bg-muted/30">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-1 flex-1 min-w-0">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done
                  ? 'bg-[#e4007c] text-white'
                  : active
                  ? 'bg-[#e4007c]/20 border-2 border-[#e4007c] text-[#e4007c]'
                  : 'bg-muted border border-border text-muted-foreground'
              }`}
            >
              {done ? <CheckCircle className="w-3.5 h-3.5" /> : step}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${done ? 'bg-[#e4007c]' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Restaurant Avatar ─────────────────────────────────────────────────────────

function RestaurantLogo({ url, name }: { url: string | null; name: string }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Store className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      onError={() => setErr(true)}
      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
    />
  );
}

// ── Modifier Modal ────────────────────────────────────────────────────────────

function ModifierModal({
  product,
  groups,
  onConfirm,
  onClose,
}: {
  product: Product;
  groups: ModifierGroup[];
  onConfirm: (modifiers: SelectedModifier[], effectivePrice: number) => void;
  onClose: () => void;
}) {
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    // Auto-select first available option for required single-select groups
    const init: Record<string, string[]> = {};
    for (const group of groups) {
      if (group.selection_type === 'single' && group.is_required) {
        const first = group.modifiers.find((m) => m.is_available);
        if (first) init[group.id] = [first.id];
      }
    }
    return init;
  });

  function toggleModifier(groupId: string, modId: string, type: 'single' | 'multiple') {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (type === 'single') return { ...prev, [groupId]: [modId] };
      const isSelected = current.includes(modId);
      return {
        ...prev,
        [groupId]: isSelected ? current.filter((id) => id !== modId) : [...current, modId],
      };
    });
  }

  const isValid = groups
    .filter((g) => g.is_required)
    .every((g) => (selections[g.id]?.length ?? 0) >= (g.min_selections || 1));

  const selectedModifiers: SelectedModifier[] = [];
  for (const group of groups) {
    for (const modId of selections[group.id] ?? []) {
      const mod = group.modifiers.find((m) => m.id === modId);
      if (mod) {
        selectedModifiers.push({
          modifierId: mod.id,
          modifierGroupId: group.id,
          name: mod.name,
          groupName: group.name,
          priceDelta: mod.price_delta,
        });
      }
    }
  }

  const priceDeltaTotal = selectedModifiers.reduce((s, m) => s + m.priceDelta, 0);
  const effectivePrice = product.price + priceDeltaTotal;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            <p className="text-sm font-medium">
              <span className="text-[#e4007c]">{formatCurrency(effectivePrice)}</span>
              {priceDeltaTotal > 0 && (
                <span className="text-muted-foreground text-xs ml-2">
                  base {formatCurrency(product.price)} + {formatCurrency(priceDeltaTotal)}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-2.5">
                <p className="text-sm font-semibold text-foreground">{group.name}</p>
                {group.is_required ? (
                  <span className="text-xs bg-[#e4007c]/10 text-[#e4007c] px-1.5 py-0.5 rounded font-medium">
                    Requerido
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Opcional</span>
                )}
                {group.selection_type === 'multiple' && (
                  <span className="text-xs text-muted-foreground ml-auto">Elige varios</span>
                )}
              </div>
              <div className="space-y-1.5">
                {group.modifiers
                  .filter((m) => m.is_available)
                  .map((mod) => {
                    const isSelected = (selections[group.id] ?? []).includes(mod.id);
                    const isMultiple = group.selection_type === 'multiple';
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModifier(group.id, mod.id, group.selection_type)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#e4007c] bg-pink-50 dark:bg-pink-950/20'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Radio vs checkbox indicator */}
                          <div
                            className={`flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                              isMultiple ? 'w-4 h-4 rounded' : 'w-4 h-4 rounded-full'
                            } ${
                              isSelected
                                ? 'border-[#e4007c] bg-[#e4007c]'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && (
                              <div
                                className={`bg-white ${
                                  isMultiple ? 'w-2 h-1.5 rounded-sm' : 'w-1.5 h-1.5 rounded-full'
                                }`}
                              />
                            )}
                          </div>
                          <span className="text-sm text-foreground">{mod.name}</span>
                        </div>
                        {mod.price_delta !== 0 && (
                          <span className="text-sm text-muted-foreground">
                            {mod.price_delta > 0 ? '+' : ''}
                            {formatCurrency(mod.price_delta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Confirm */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            onClick={() => isValid && onConfirm(selectedModifiers, effectivePrice)}
            disabled={!isValid}
            className="w-full py-3 bg-[#e4007c] text-white rounded-xl font-semibold text-sm hover:bg-[#c8006e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar · {formatCurrency(effectivePrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CreateOrderPanelProps {
  conversation: WhatsAppConversation;
  adminId: string;
  onClose: () => void;
}

export default function CreateOrderPanel({
  conversation,
  adminId,
  onClose,
}: CreateOrderPanelProps) {
  const contact = conversation.whatsapp_contacts;
  const contactPhone = contact ? normalizePhone(contact.phone) : '';

  // ── Wizard state ──
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [linkedUser, setLinkedUser] = useState<CrmUser | null>(null);
  const [userSearchDone, setUserSearchDone] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [manualSearching, setManualSearching] = useState(false);

  // ── Restaurants ──
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // ── Products & cart ──
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [productModifierFlags, setProductModifierFlags] = useState<Record<string, boolean>>({});
  const [loadingModifiersFor, setLoadingModifiersFor] = useState<string | null>(null);
  const [modifierTarget, setModifierTarget] = useState<{
    product: Product;
    groups: ModifierGroup[];
  } | null>(null);

  // ── Address & maps ──
  const [address, setAddress] = useState('');
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLon, setAddressLon] = useState<number | null>(null);
  const [inCoverageZone, setInCoverageZone] = useState<boolean | null>(null);
  const [clientAddressLoaded, setClientAddressLoaded] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const coverageZonesRef = useRef<CoverageZone[]>([]);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<unknown>(null);

  // ── Payment & submission ──
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'spei'>('cash');
  const [mapZoom, setMapZoom] = useState(16);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // ── Derived ──
  const subtotal = cart.reduce((s, l) => s + l.effectivePrice * l.quantity, 0);
  const totalItems = cart.reduce((s, l) => s + l.quantity, 0);
  const totalAmount = subtotal + (selectedRestaurant?.delivery_fee ?? 0);

  // ── Effect: load Google Maps once on mount ──
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google as { maps?: unknown } | undefined;
    if (g?.maps) { setMapsReady(true); return; }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    // Reuse script if already injected
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => setMapsReady(true));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsReady(true);
    document.head.appendChild(script);
  }, []);

  // ── Effect: load coverage zones once on mount ──
  useEffect(() => {
    supabase
      .from('coverage_zones')
      .select('center_lat, center_lon, radius_km')
      .then(({ data }) => {
        if (data) coverageZonesRef.current = data as CoverageZone[];
      });
  }, []);

  // ── Effect: Step 1 — auto-search user by phone or user_id ──
  useEffect(() => {
    if (userSearchDone) return;
    (async () => {
      if (contact?.user_id) {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('id', contact.user_id)
          .maybeSingle();
        if (data) setLinkedUser(data as CrmUser);
      } else if (contactPhone) {
        const { user } = await searchUserByPhone(contactPhone);
        if (user) {
          setLinkedUser(user);
          if (contact?.id) await linkContactToUser(contact.id, user.id);
        }
      }
      setUserSearchDone(true);
    })();
  }, [contact, contactPhone, userSearchDone]);

  // ── Effect: Step 2 — load restaurants ──
  const loadRestaurants = useCallback(async () => {
    setRestaurantsLoading(true);
    const { data } = await supabase
      .from('restaurants')
      .select('id, name, logo_url, cuisine_type, delivery_fee, estimated_delivery_time_minutes')
      .eq('status', 'approved')
      .eq('online', true)
      .order('name');
    setRestaurants((data as Restaurant[]) ?? []);
    setRestaurantsLoading(false);
  }, []);

  useEffect(() => {
    if (step === 2) loadRestaurants();
  }, [step, loadRestaurants]);

  // ── Effect: Step 3 — load products + modifier flags ──
  useEffect(() => {
    if (step !== 3 || !selectedRestaurant) return;
    (async () => {
      setProductsLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, type, image_url')
        .eq('restaurant_id', selectedRestaurant.id)
        .eq('is_available', true)
        .order('type')
        .order('name');
      const prods = (data as Product[]) ?? [];
      setProducts(prods);
      setProductsLoading(false);

      if (prods.length > 0) {
        const ids = prods.map((p) => p.id);
        const { data: mgData } = await supabase
          .from('product_modifier_groups')
          .select('product_id')
          .in('product_id', ids);
        const flags: Record<string, boolean> = {};
        for (const id of ids) flags[id] = false;
        for (const row of mgData ?? []) flags[(row as { product_id: string }).product_id] = true;
        setProductModifierFlags(flags);
      }
    })();
  }, [step, selectedRestaurant]);

  // ── Effect: Step 4 — pre-fill address from client profile ──
  useEffect(() => {
    if (step !== 4 || !linkedUser || clientAddressLoaded) return;
    setClientAddressLoaded(true);
    (async () => {
      const { data } = await supabase
        .from('client_profiles')
        .select('address, lat, lon')
        .eq('user_id', linkedUser.id)
        .maybeSingle();
      if (data?.address && !address) {
        setAddress(data.address);
        const lat = (data as { lat?: number }).lat ?? null;
        const lon = (data as { lon?: number }).lon ?? null;
        if (lat && lon) {
          setAddressLat(lat);
          setAddressLon(lon);
          const inZone = coverageZonesRef.current.some(
            (z) => haversineKm(lat, lon, z.center_lat, z.center_lon) <= z.radius_km,
          );
          setInCoverageZone(inZone);
        }
      }
    })();
  }, [step, linkedUser, clientAddressLoaded, address]);

  // ── Effect: Step 4 — init Places Autocomplete ──
  useEffect(() => {
    if (step !== 4 || !mapsReady || !addressInputRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google as {
      maps?: { places?: { Autocomplete?: new (...args: unknown[]) => unknown } };
    } | undefined;
    if (!g?.maps?.places?.Autocomplete) return;

    const Autocomplete = g.maps.places.Autocomplete as new (
      input: HTMLInputElement,
      opts: unknown,
    ) => { getPlace: () => unknown; addListener: (event: string, fn: () => void) => unknown };

    const ac = new Autocomplete(addressInputRef.current, {
      types: ['address'],
      fields: ['formatted_address', 'geometry'],
    });

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace() as {
        formatted_address?: string;
        geometry?: { location?: { lat: () => number; lng: () => number } };
      };
      if (place.formatted_address) setAddress(place.formatted_address);
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lon = place.geometry.location.lng();
        setAddressLat(lat);
        setAddressLon(lon);
        const inZone = coverageZonesRef.current.some(
          (z) => haversineKm(lat, lon, z.center_lat, z.center_lon) <= z.radius_km,
        );
        setInCoverageZone(inZone);
      }
    });

    autocompleteRef.current = ac;
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ge = (window as any).google as {
        maps?: { event?: { removeListener: (l: unknown) => void } };
      } | undefined;
      ge?.maps?.event?.removeListener(listener);
      autocompleteRef.current = null;
    };
  }, [step, mapsReady]);

  // ── Cart helpers ──
  function addCartLine(product: Product, modifiers: SelectedModifier[], effectivePrice: number) {
    const lineKey = makeLineKey(product.id, modifiers);
    setCart((prev) => {
      const existing = prev.find((l) => l.lineKey === lineKey);
      if (existing) {
        return prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { lineKey, product, quantity: 1, modifiers, effectivePrice }];
    });
  }

  function removeCartLine(lineKey: string) {
    setCart((prev) => {
      const line = prev.find((l) => l.lineKey === lineKey);
      if (!line) return prev;
      if (line.quantity === 1) return prev.filter((l) => l.lineKey !== lineKey);
      return prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity: l.quantity - 1 } : l));
    });
  }

  function cartQtyForProduct(productId: string): number {
    return cart
      .filter((l) => l.product.id === productId)
      .reduce((s, l) => s + l.quantity, 0);
  }

  async function handleOpenModifierModal(product: Product) {
    setLoadingModifiersFor(product.id);
    const { data } = await supabase
      .from('product_modifier_groups')
      .select('modifier_groups!inner(*, modifiers(*))')
      .eq('product_id', product.id)
      .eq('modifier_groups.is_active', true)
      .order('sort_order');
    const flatData = (data ?? []).map((row: any) => row.modifier_groups).filter(Boolean);

    const groups: ModifierGroup[] = flatData.map((g: unknown) => {
      const group = g as {
        id: string; name: string; selection_type: 'single' | 'multiple';
        min_selections: number; max_selections: number; is_required: boolean;
        sort_order: number; modifiers: ModifierOption[];
      };
      return {
        ...group,
        modifiers: (group.modifiers ?? [])
          .filter((m: ModifierOption) => m.is_available)
          .sort((a: ModifierOption, b: ModifierOption) => a.sort_order - b.sort_order),
      };
    });

    setLoadingModifiersFor(null);

    if (groups.length === 0) {
      addCartLine(product, [], product.price);
    } else {
      setModifierTarget({ product, groups });
    }
  }

  // ── Submit ──
  async function handleCreateOrder() {
    if (!linkedUser || !selectedRestaurant) return;
    setSubmitting(true);
    try {
      const items: OrderItem[] = cart.map((line) => ({
        productId: line.product.id,
        name: line.product.name,
        quantity: line.quantity,
        unitPrice: line.effectivePrice,
        modifiers: line.modifiers.map((m): OrderItemModifier => ({
          modifierId: m.modifierId,
          modifierGroupId: m.modifierGroupId,
          name: m.name,
          groupName: m.groupName,
          priceDelta: m.priceDelta,
        })),
      }));

      const { orderId, error } = await createManualOrder({
        userId: linkedUser.id,
        restaurantId: selectedRestaurant.id,
        items,
        deliveryAddress: address,
        paymentMethod,
        notes: notes || undefined,
        adminId,
      });

      if (error || !orderId) {
        toast.error(error ?? 'Error al crear la orden');
        return;
      }
      setCreatedOrderId(orderId);
      toast.success('Orden creada correctamente');

      // Send WA confirmation directly via Clawbot — bypasses bot_active state
      const confirmMsg =
        `✅ *¡Tu orden ha sido registrada!*\n\n` +
        `🏪 *${selectedRestaurant.name}*\n` +
        `💰 *Total: ${formatCurrency(totalAmount)}*\n` +
        `📍 *Entrega:* ${address.slice(0, 80)}${address.length > 80 ? '...' : ''}\n\n` +
        `Te avisaremos cuando el restaurante confirme tu pedido. 🙌`;
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id, message: confirmMsg }),
      }).catch((e) => console.warn('[CreateOrderPanel] WA confirm failed:', e));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Grouped products ──
  const productGroups = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.type || 'otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(restaurantSearch.toLowerCase()),
  );

  // Static map URL — regenerates when mapZoom changes
  const mapUrl =
    addressLat && addressLon
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${addressLat},${addressLon}&zoom=${mapZoom}&size=800x320&scale=2&markers=color:red%7C${addressLat},${addressLon}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      : null;

  // ── SUCCESS screen ──────────────────────────────────────────────────────────
  if (createdOrderId) {
    return (
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-background border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Nueva Orden</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">¡Orden creada!</h3>
            <p className="text-sm text-muted-foreground">
              Registrada en el sistema y pendiente de confirmación por el restaurante.
            </p>
          </div>
          <div className="w-full space-y-2">
            <Link
              href={`/admin/orders/${createdOrderId}`}
              className="block w-full py-2.5 px-4 bg-[#e4007c] text-white rounded-lg text-sm font-medium text-center hover:bg-[#c8006e] transition-colors"
            >
              Ver orden #{createdOrderId.slice(0, 8).toUpperCase()}
            </Link>
            <button
              onClick={onClose}
              className="block w-full py-2.5 px-4 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PANEL ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-background border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag className="w-4 h-4 text-[#e4007c] flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground leading-tight">Nueva Orden</h2>
              <p className="text-xs text-muted-foreground truncate">
                {contact?.name || contactPhone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <StepBar current={step} />

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── STEP 1: Cliente ── */}
          {step === 1 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-[#e4007c]" />
                <h3 className="font-semibold text-foreground">Cliente</h3>
              </div>

              {/* WA contact */}
              <div className="bg-muted/40 rounded-xl p-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Contacto WhatsApp
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm flex-shrink-0">
                    {(contact?.name || contactPhone).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {contact?.name || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-muted-foreground">+{contactPhone}</p>
                  </div>
                </div>
              </div>

              {/* Linked user */}
              {!userSearchDone ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando cuenta registrada...
                </div>
              ) : linkedUser ? (
                <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {linkedUser.name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground">{linkedUser.email}</p>
                        {linkedUser.phone && (
                          <p className="text-xs text-muted-foreground">{linkedUser.phone}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setLinkedUser(null)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserX className="w-4 h-4" />
                    <p className="text-sm">No se encontró cuenta automáticamente</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Buscar por número celular real
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="Ej: 5216566452737"
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && manualPhone.trim() && !manualSearching) {
                            (async () => {
                              setManualSearching(true);
                              const { user } = await searchUserByPhone(manualPhone.trim());
                              if (user) {
                                setLinkedUser(user);
                                if (contact?.id) await linkContactToUser(contact.id, user.id);
                                toast.success(`Usuario encontrado: ${user.name || user.email}`);
                              } else {
                                toast.error('No se encontró ningún usuario con ese número');
                              }
                              setManualSearching(false);
                            })();
                          }
                        }}
                      />
                      <button
                        disabled={!manualPhone.trim() || manualSearching}
                        onClick={async () => {
                          setManualSearching(true);
                          const { user } = await searchUserByPhone(manualPhone.trim());
                          if (user) {
                            setLinkedUser(user);
                            if (contact?.id) await linkContactToUser(contact.id, user.id);
                            toast.success(`Usuario encontrado: ${user.name || user.email}`);
                          } else {
                            toast.error('No se encontró ningún usuario con ese número');
                          }
                          setManualSearching(false);
                        }}
                        className="px-3 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {manualSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      El ID de WA puede no coincidir con el celular registrado.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-muted/30 text-muted-foreground">o</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="w-full py-2 px-4 bg-[#e4007c] text-white rounded-lg text-sm font-medium hover:bg-[#c8006e] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar nuevo cliente
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Restaurante ── */}
          {step === 2 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-[#e4007c]" />
                <h3 className="font-semibold text-foreground">Seleccionar restaurante</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={restaurantSearch}
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  placeholder="Buscar restaurante..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition"
                />
              </div>

              {restaurantsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando restaurantes...
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="w-8 h-8 mx-auto mb-2 text-muted" />
                  {restaurantSearch
                    ? 'Sin resultados'
                    : 'No hay restaurantes online en este momento'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRestaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRestaurant(r);
                        setCart([]);
                        setProductModifierFlags({});
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedRestaurant?.id === r.id
                          ? 'border-[#e4007c] bg-pink-50 dark:bg-pink-950/20'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <RestaurantLogo url={r.logo_url} name={r.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {r.cuisine_type || '—'}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Truck className="w-3 h-3" /> ${r.delivery_fee}
                          </span>
                          {r.estimated_delivery_time_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> ~{r.estimated_delivery_time_minutes}
                              min
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedRestaurant?.id === r.id && (
                        <CheckCircle className="w-4 h-4 text-[#e4007c] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Productos ── */}
          {step === 3 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-[#e4007c]" />
                <h3 className="font-semibold text-foreground">Agregar productos</h3>
                {totalItems > 0 && (
                  <span className="ml-auto text-xs font-medium bg-[#e4007c]/10 text-[#e4007c] px-2 py-0.5 rounded-full">
                    {totalItems} item{totalItems > 1 ? 's' : ''} · {formatCurrency(subtotal)}
                  </span>
                )}
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando menú...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-muted" />
                  No hay productos disponibles
                </div>
              ) : (
                Object.entries(productGroups).map(([type, items]) => (
                  <div key={type}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 capitalize">
                      {type}
                    </p>
                    <div className="space-y-2">
                      {items.map((product) => {
                        const hasModifiers = productModifierFlags[product.id] === true;
                        const qty = cartQtyForProduct(product.id);
                        const noModKey = makeLineKey(product.id, []);
                        const isLoadingThis = loadingModifiersFor === product.id;

                        return (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.description}
                                </p>
                              )}
                              <p className="text-sm font-semibold text-foreground mt-0.5">
                                {formatCurrency(product.price)}
                                {hasModifiers && (
                                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                    · con extras
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasModifiers ? (
                                /* Products with modifier groups: always show Agregar + count badge */
                                <div className="flex flex-col items-end gap-1">
                                  {qty > 0 && (
                                    <span className="text-xs font-bold text-[#e4007c] leading-none">
                                      ×{qty} en carrito
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleOpenModifierModal(product)}
                                    disabled={isLoadingThis}
                                    className="px-3 py-1.5 bg-[#e4007c] text-white text-xs font-medium rounded-lg hover:bg-[#c8006e] transition-colors disabled:opacity-60 flex items-center gap-1"
                                  >
                                    {isLoadingThis ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Plus className="w-3 h-3" />
                                    )}
                                    Agregar
                                  </button>
                                </div>
                              ) : qty > 0 ? (
                                /* Products without modifiers: inline +/- */
                                <>
                                  <button
                                    onClick={() => removeCartLine(noModKey)}
                                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-5 text-center text-sm font-semibold text-foreground">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => addCartLine(product, [], product.price)}
                                    className="w-7 h-7 rounded-full bg-[#e4007c] flex items-center justify-center hover:bg-[#c8006e] transition-colors text-white"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => addCartLine(product, [], product.price)}
                                  className="px-3 py-1.5 bg-[#e4007c] text-white text-xs font-medium rounded-lg hover:bg-[#c8006e] transition-colors"
                                >
                                  Agregar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── STEP 4: Dirección ── */}
          {step === 4 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-[#e4007c]" />
                <h3 className="font-semibold text-foreground">Dirección de entrega</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Dirección <span className="text-[#e4007c]">*</span>
                  {!mapsReady && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      (cargando Google Maps…)
                    </span>
                  )}
                </label>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    // Reset geo data when user edits manually
                    if (addressLat) {
                      setAddressLat(null);
                      setAddressLon(null);
                      setInCoverageZone(null);
                    }
                  }}
                  placeholder={mapsReady ? 'Busca la dirección…' : 'Calle, número, colonia…'}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition"
                />
              </div>

              {/* Coverage indicator */}
              {inCoverageZone !== null && (
                <div
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                    inCoverageZone
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {inCoverageZone ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>
                    {inCoverageZone
                      ? 'Dentro del rango de entrega'
                      : 'Posiblemente fuera del rango — confirmar con el cliente'}
                  </span>
                </div>
              )}

              {/* Mini-map with zoom controls */}
              {mapUrl && (
                <div className="rounded-xl overflow-hidden border border-border relative">
                  <img
                    src={mapUrl}
                    alt="Mapa de entrega"
                    className="w-full h-40 object-cover"
                  />
                  {/* Zoom +/- */}
                  <div className="absolute bottom-2 right-2 flex flex-col gap-0.5">
                    <button
                      onClick={() => setMapZoom((z) => Math.min(z + 1, 20))}
                      className="w-7 h-7 rounded bg-white/95 shadow text-gray-800 font-bold text-base flex items-center justify-center hover:bg-white transition-colors leading-none select-none"
                    >+</button>
                    <button
                      onClick={() => setMapZoom((z) => Math.max(z - 1, 10))}
                      className="w-7 h-7 rounded bg-white/95 shadow text-gray-800 font-bold text-base flex items-center justify-center hover:bg-white transition-colors leading-none select-none"
                    >−</button>
                  </div>
                  {/* Open in Google Maps */}
                  <a
                    href={`https://maps.google.com/?q=${addressLat},${addressLon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 left-2 text-xs bg-white/95 shadow rounded px-2 py-1 text-blue-600 hover:bg-white transition-colors font-medium"
                  >
                    Abrir ↗
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Notas para el restaurante{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: sin cebolla, extra salsa, etc."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition resize-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 5: Resumen y Pago ── */}
          {step === 5 && selectedRestaurant && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-[#e4007c]" />
                <h3 className="font-semibold text-foreground">Resumen y pago</h3>
              </div>

              {/* Client + Restaurant */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/40 rounded-xl p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Cliente</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {linkedUser?.name || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {linkedUser?.phone || linkedUser?.email}
                  </p>
                  {contactPhone && (
                    <p className="text-xs text-green-600 dark:text-green-400 truncate mt-0.5">
                      WA: +{contactPhone}
                    </p>
                  )}
                </div>
                <div className="bg-muted/40 rounded-xl p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Restaurante</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedRestaurant.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {selectedRestaurant.cuisine_type || '—'}
                  </p>
                </div>
              </div>

              {/* Delivery address */}
              <div className="bg-muted/40 rounded-xl p-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Dirección
                </p>
                <p className="text-sm text-foreground">{address}</p>
                {notes && <p className="text-xs text-muted-foreground mt-1">Nota: {notes}</p>}
              </div>

              {/* Cart items */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Productos
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {cart.map((line) => (
                    <div key={line.lineKey} className="flex items-start justify-between px-3 py-2.5 gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#e4007c]/10 text-[#e4007c] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {line.quantity}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm text-foreground">{line.product.name}</span>
                          {line.modifiers.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {line.modifiers.map((m) => m.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(line.effectivePrice * line.quantity)}
                        </span>
                        <button
                          onClick={() => removeCartLine(line.lineKey)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border divide-y divide-border/50">
                  <div className="flex justify-between px-3 py-2 text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Envío
                    </span>
                    <span>{formatCurrency(selectedRestaurant.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 text-sm font-bold text-foreground bg-muted/30">
                    <span>Total</span>
                    <span className="text-[#e4007c]">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Método de pago</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: 'cash', label: 'Efectivo', Icon: Banknote },
                      { key: 'spei', label: 'SPEI / Transferencia', Icon: Building2 },
                    ] as const
                  ).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      className={`py-3 px-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1.5 ${
                        paymentMethod === key
                          ? 'border-[#e4007c] bg-pink-50 dark:bg-pink-950/20 text-[#e4007c]'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex-shrink-0 border-t border-border p-4">
          {step === 5 ? (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={
                  submitting ||
                  !linkedUser ||
                  !selectedRestaurant ||
                  cart.length === 0 ||
                  !address.trim()
                }
                className="flex-1 py-2.5 px-4 bg-[#e4007c] text-white rounded-lg text-sm font-semibold hover:bg-[#c8006e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Crear Orden · {formatCurrency(totalAmount)}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
              )}
              <button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5)}
                disabled={
                  (step === 1 && !linkedUser) ||
                  (step === 2 && !selectedRestaurant) ||
                  (step === 3 && cart.length === 0) ||
                  (step === 4 && !address.trim())
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#e4007c] text-white rounded-lg text-sm font-semibold hover:bg-[#c8006e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 4
                  ? 'Ver resumen'
                  : step === 3
                  ? `Continuar (${totalItems} item${totalItems !== 1 ? 's' : ''})`
                  : 'Continuar'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modifier modal */}
      {modifierTarget && (
        <ModifierModal
          product={modifierTarget.product}
          groups={modifierTarget.groups}
          onConfirm={(modifiers, effectivePrice) => {
            addCartLine(modifierTarget.product, modifiers, effectivePrice);
            setModifierTarget(null);
          }}
          onClose={() => setModifierTarget(null)}
        />
      )}

      {/* Register user modal */}
      {showRegisterModal && contact && (
        <RegisterUserModal
          contactId={contact.id}
          phone={contactPhone}
          defaultName={contact.name || ''}
          onRegistered={(userId, name) => {
            setLinkedUser({ id: userId, name, email: '', phone: contactPhone });
            setShowRegisterModal(false);
          }}
          onClose={() => setShowRegisterModal(false)}
        />
      )}
    </>
  );
}
