'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X, ChevronRight, ChevronLeft, User, Store, ShoppingBag,
  MapPin, CheckCircle, Loader2, Plus, Minus, Search,
  Clock, Truck, UserCheck, UserX, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import type { WhatsAppConversation } from '@/lib/hooks/useWhatsappConversations';
import {
  searchUserByPhone, linkContactToUser, createManualOrder,
  type CrmUser, type OrderItem,
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

interface CartItem {
  product: Product;
  quantity: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  return raw.split('@')[0].trim();
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
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
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              done
                ? 'bg-[#e4007c] text-white'
                : active
                ? 'bg-[#e4007c]/20 border-2 border-[#e4007c] text-[#e4007c]'
                : 'bg-muted border border-border text-muted-foreground'
            }`}>
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

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // ── Step 1: Auto-search user by phone or user_id ──
  useEffect(() => {
    if (userSearchDone) return;
    (async () => {
      // If contact already linked → fetch user details
      if (contact?.user_id) {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('id', contact.user_id)
          .maybeSingle();
        if (data) setLinkedUser(data as CrmUser);
      } else if (contactPhone) {
        // Try to find by phone
        const { user } = await searchUserByPhone(contactPhone);
        if (user) {
          setLinkedUser(user);
          // Auto-link silently
          if (contact?.id) await linkContactToUser(contact.id, user.id);
        }
      }
      setUserSearchDone(true);
    })();
  }, [contact, contactPhone, userSearchDone]);

  // ── Step 2: Load restaurants ──
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

  // ── Step 3: Load products ──
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
      setProducts((data as Product[]) ?? []);
      setProductsLoading(false);
    })();
  }, [step, selectedRestaurant]);

  // ── Cart helpers ──
  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.product.id !== productId);
      return prev.map((c) => c.product.id === productId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function cartQty(productId: string): number {
    return cart.find((c) => c.product.id === productId)?.quantity ?? 0;
  }

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalAmount = subtotal + (selectedRestaurant?.delivery_fee ?? 0);

  // ── Submit order ──
  async function handleCreateOrder() {
    if (!linkedUser || !selectedRestaurant) return;
    setSubmitting(true);
    try {
      const items: OrderItem[] = cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        quantity: c.quantity,
        unitPrice: c.product.price,
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
      toast.success('✅ Orden creada correctamente');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Group products by type ──
  const productGroups = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.type || 'otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(restaurantSearch.toLowerCase()),
  );

  // ── SUCCESS screen ──────────────────────────────────────────────────────────
  if (createdOrderId) {
    return (
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-background border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Nueva Orden</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
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
              La orden fue registrada en el sistema y está pendiente de confirmación por el restaurante.
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
              <p className="text-xs text-muted-foreground truncate">{contact?.name || contactPhone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step bar */}
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

              {/* WA Contact info */}
              <div className="bg-muted/40 rounded-xl p-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Contacto WhatsApp</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm flex-shrink-0">
                    {(contact?.name || contactPhone).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{contact?.name || 'Sin nombre'}</p>
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
                        <p className="text-sm font-semibold text-foreground">{linkedUser.name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">{linkedUser.email}</p>
                        {linkedUser.phone && <p className="text-xs text-muted-foreground">{linkedUser.phone}</p>}
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
                    <p className="text-sm">Este contacto no tiene cuenta registrada</p>
                  </div>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="w-full py-2 px-4 bg-[#e4007c] text-white rounded-lg text-sm font-medium hover:bg-[#c8006e] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar nuevo cliente
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-background text-muted-foreground">o buscar por teléfono</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setUserSearchDone(false);
                      const { user } = await searchUserByPhone(contactPhone);
                      if (user) {
                        setLinkedUser(user);
                        if (contact?.id) await linkContactToUser(contact.id, user.id);
                        toast.success('Usuario encontrado y vinculado');
                      } else {
                        toast.error('No se encontró ningún usuario con este número');
                      }
                      setUserSearchDone(true);
                    }}
                    className="w-full py-2 px-4 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Buscar cuenta existente
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

              {/* Search */}
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
                  {restaurantSearch ? 'Sin resultados' : 'No hay restaurantes online en este momento'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRestaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRestaurant(r); setCart([]); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedRestaurant?.id === r.id
                          ? 'border-[#e4007c] bg-pink-50 dark:bg-pink-950/20'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <RestaurantLogo url={r.logo_url} name={r.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.cuisine_type || '—'}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Truck className="w-3 h-3" /> ${r.delivery_fee}
                          </span>
                          {r.estimated_delivery_time_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> ~{r.estimated_delivery_time_minutes}min
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
                        const qty = cartQty(product.id);
                        return (
                          <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                              )}
                              <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(product.price)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {qty > 0 ? (
                                <>
                                  <button
                                    onClick={() => removeFromCart(product.id)}
                                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-5 text-center text-sm font-semibold text-foreground">{qty}</span>
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="w-7 h-7 rounded-full bg-[#e4007c] flex items-center justify-center hover:bg-[#c8006e] transition-colors text-white"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => addToCart(product)}
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
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, colonia, ciudad..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition resize-none"
                />
              </div>

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

              {/* Client + Restaurant summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/40 rounded-xl p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Cliente</p>
                  <p className="text-sm font-semibold text-foreground truncate">{linkedUser?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{linkedUser?.phone || linkedUser?.email}</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Restaurante</p>
                  <p className="text-sm font-semibold text-foreground truncate">{selectedRestaurant.name}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{selectedRestaurant.cuisine_type || '—'}</p>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Productos</p>
                </div>
                <div className="divide-y divide-border">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#e4007c]/10 text-[#e4007c] text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {item.quantity}
                        </span>
                        <span className="text-sm text-foreground">{item.product.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border divide-y divide-border/50">
                  <div className="flex justify-between px-3 py-2 text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Envío</span>
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
                  {([
                    { key: 'cash', label: '💵 Efectivo' },
                    { key: 'card', label: '💳 Tarjeta' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === key
                          ? 'border-[#e4007c] bg-pink-50 dark:bg-pink-950/20 text-[#e4007c]'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer: navigation buttons */}
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
                disabled={submitting || !linkedUser || !selectedRestaurant || cart.length === 0 || !address.trim()}
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
                {step === 4 ? 'Ver resumen' : step === 3 ? `Continuar (${totalItems} item${totalItems !== 1 ? 's' : ''})` : 'Continuar'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

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
