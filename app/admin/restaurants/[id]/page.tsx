'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileText,
    Image as ImageIcon,
    Utensils,
    DollarSign,
    Navigation,
    User,
    ChevronLeft,
    Wifi,
    WifiOff,
    Percent,
    Loader2,
    Zap,
    ToggleLeft,
    ToggleRight,
    Package,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { toggleRestaurantOnline, updateRestaurantCommission, updateRestaurantStatus, toggleProductAvailability, updateProductPrice, updateModifier, deleteModifier } from '../actions';
import { BusinessHoursEditor } from '../components/BusinessHoursEditor';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface RestaurantDetailProps {
    params: Promise<{
        id: string;
    }>;
}

// ─── Sub-component: modifier card — edit name, price, delete ─────────────────
function ModifierPriceCard({ mod, productId, groupId, onSaved, onDeleted }: {
    mod: { id: string; name: string; price_delta: number };
    productId: string;
    groupId: string;
    onSaved: (modId: string, groupId: string, productId: string, newName: string, newDelta: number) => void;
    onDeleted: (modId: string, groupId: string, productId: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [nameVal, setNameVal] = useState('');
    const [priceVal, setPriceVal] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fmtMXN = (n: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

    const open = () => {
        setNameVal(mod.name);
        setPriceVal(String(Number(mod.price_delta)));
        setEditing(true);
        setConfirmDelete(false);
    };

    const save = async () => {
        const newDelta = parseFloat(priceVal);
        if (isNaN(newDelta) || newDelta < 0 || !nameVal.trim()) return;
        setSaving(true);
        const { error } = await updateModifier(mod.id, { name: nameVal.trim(), price_delta: newDelta });
        setSaving(false);
        if (!error) {
            onSaved(mod.id, groupId, productId, nameVal.trim(), newDelta);
            setEditing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeleting(true);
        const { error } = await deleteModifier(mod.id);
        setDeleting(false);
        if (!error) onDeleted(mod.id, groupId, productId);
    };

    if (editing) {
        return (
            <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-[#e4007c]/40 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Editar opción</p>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-0.5 block">Nombre</label>
                        <input
                            type="text"
                            value={nameVal}
                            onChange={e => setNameVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
                            autoFocus
                            placeholder="Nombre del extra"
                            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4007c]/30"
                        />
                    </div>
                    <div className="w-28">
                        <label className="text-xs text-gray-400 mb-0.5 block">Precio extra ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.50"
                            value={priceVal}
                            onChange={e => setPriceVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                            placeholder="0.00"
                            className="w-full text-sm text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4007c]/30"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                    <button
                        onClick={save}
                        disabled={saving || !nameVal.trim()}
                        className="flex-1 py-1.5 bg-[#e4007c] text-white text-xs font-bold rounded-lg hover:bg-[#c8006e] disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Guardando…' : '✓ Guardar'}
                    </button>
                    <button
                        onClick={() => setEditing(false)}
                        className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="group flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded-lg px-2.5 py-2 border border-gray-100 dark:border-gray-700 gap-1.5 min-h-[34px]">
            {/* Name */}
            <span className="text-gray-700 dark:text-gray-300 truncate flex-shrink min-w-0">{mod.name}</span>

            <div className="flex items-center gap-1 flex-shrink-0">
                {/* Price */}
                <button
                    onClick={open}
                    title="Editar nombre y precio"
                    className={`font-semibold transition-colors hover:opacity-80 flex items-center gap-0.5 ${
                        mod.price_delta > 0 ? 'text-[#e4007c]' : 'text-gray-400 dark:text-gray-500'
                    }`}
                >
                    {mod.price_delta > 0 ? `+${fmtMXN(mod.price_delta)}` : 'Incluido'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 opacity-40 group-hover:opacity-80 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>

                {/* Delete */}
                {confirmDelete ? (
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-red-500 font-medium">¿Eliminar?</span>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-xs px-1.5 py-0.5 bg-red-500 text-white rounded font-bold hover:bg-red-600 disabled:opacity-50"
                        >
                            {deleting ? '…' : 'Sí'}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300"
                        >
                            No
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        title="Eliminar opción"
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-red-400 hover:text-red-600 p-0.5 rounded"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export default function RestaurantDetailPage({ params }: RestaurantDetailProps) {
    const { id } = use(params);
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [productsCount, setProductsCount] = useState(0);
    const [ordersCount, setOrdersCount] = useState(0);
    const [accountBalance, setAccountBalance] = useState(0);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [togglingOnline, setTogglingOnline] = useState(false);
    const [editingCommission, setEditingCommission] = useState(false);
    const [commissionBps, setCommissionBps] = useState(0);
    const [savingCommission, setSavingCommission] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editingPriceValue, setEditingPriceValue] = useState<string>('');
    const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

    useEffect(() => {
        fetchRestaurantDetails();
    }, [id]);

    const fetchRestaurantDetails = async () => {
        setLoading(true);
        try {
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .select(`
                    *,
                    owner:users!user_id (
                        name,
                        email,
                        phone
                    )
                `)
                .eq('id', id)
                .single();

            if (restaurantError) throw restaurantError;

            const { count: prodCount, error: countError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', id);

            if (countError) console.error("Error fetching product count", countError);

            const { count: ordCount, error: orderError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', id);

            if (orderError) console.error("Error fetching order count", orderError);

            const { data: accountData, error: accountError } = await supabase
                .from('accounts')
                .select('balance')
                .eq('user_id', restaurantData.user_id)
                .single();

            if (accountError && accountError.code !== 'PGRST116') {
                console.error("Error fetching account balance", accountError);
            }

            const { data: ordersData, error: recentOrdersError } = await supabase
                .from('orders')
                .select('id, total_amount, status, created_at, client:users!user_id(name)')
                .eq('restaurant_id', id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentOrdersError) console.error("Error fetching recent orders", recentOrdersError);

            const { data: productsData } = await supabase
                .from('products')
                .select('id, name, description, price, image_url, is_available, type, modifier_groups(id, name, selection_type, modifiers(id, name, price_delta))')
                .eq('restaurant_id', id)
                .order('type')
                .order('name');

            setRestaurant(restaurantData);
            setProductsCount(prodCount || 0);
            setProducts(productsData || []);
            setOrdersCount(ordCount || 0);
            setAccountBalance(accountData?.balance || 0);
            setRecentOrders(ordersData || []);
            setCommissionBps(restaurantData?.commission_bps ?? 1500);

        } catch (error) {
            console.error('Error fetching restaurant details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        const { error } = await updateRestaurantStatus(id, newStatus as any);
        if (error) { alert('Error: ' + error); return; }
        setRestaurant({ ...restaurant, status: newStatus });
    };

    const handleToggleOnline = async () => {
        setTogglingOnline(true);
        const { error } = await toggleRestaurantOnline(id, !restaurant.online);
        setTogglingOnline(false);
        if (error) { alert('Error: ' + error); return; }
        setRestaurant({ ...restaurant, online: !restaurant.online, business_hours_enabled: false });
    };

    const handleSaveCommission = async () => {
        setSavingCommission(true);
        const { error } = await updateRestaurantCommission(id, commissionBps);
        setSavingCommission(false);
        if (error) { alert('Error: ' + error); return; }
        setRestaurant({ ...restaurant, commission_bps: commissionBps });
        setEditingCommission(false);
    };

    const handleToggleProduct = async (productId: string, currentAvailable: boolean) => {
        setTogglingProductId(productId);
        const { error } = await toggleProductAvailability(productId, !currentAvailable);
        setTogglingProductId(null);
        if (!error) {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: !currentAvailable } : p));
        }
    };

    const toggleExpanded = (productId: string) => {
        setExpandedProducts(prev => {
            const next = new Set(prev);
            next.has(productId) ? next.delete(productId) : next.add(productId);
            return next;
        });
    };

    const startEditingPrice = (product: any) => {
        // product.price is the PLATFORM price; derive cocina price for editing
        const cocinaPrice = Number(product.price) / (1 + commissionRate);
        setEditingPriceId(product.id);
        setEditingPriceValue(cocinaPrice.toFixed(2));
    };

    const cancelEditingPrice = () => {
        setEditingPriceId(null);
        setEditingPriceValue('');
    };

    const savePrice = async (productId: string) => {
        const cocinaInput = parseFloat(editingPriceValue);
        if (isNaN(cocinaInput) || cocinaInput <= 0) return;
        // Save platform price = cocina * (1 + commission)
        const newPlatformPrice = Math.round(cocinaInput * (1 + commissionRate) * 100) / 100;
        setSavingPriceId(productId);
        const { error } = await updateProductPrice(productId, newPlatformPrice);
        setSavingPriceId(null);
        if (!error) {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: newPlatformPrice } : p));
            setEditingPriceId(null);
        }
    };

    const handleModifierSaved = (modId: string, groupId: string, productId: string, newName: string, newDelta: number) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            return {
                ...p,
                modifier_groups: p.modifier_groups.map((g: any) => {
                    if (g.id !== groupId) return g;
                    return {
                        ...g,
                        modifiers: g.modifiers.map((m: any) =>
                            m.id === modId ? { ...m, name: newName, price_delta: newDelta } : m
                        ),
                    };
                }),
            };
        }));
    };

    const handleModifierDeleted = (modId: string, groupId: string, productId: string) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            return {
                ...p,
                modifier_groups: p.modifier_groups.map((g: any) => {
                    if (g.id !== groupId) return g;
                    return {
                        ...g,
                        modifiers: g.modifiers.filter((m: any) => m.id !== modId),
                    };
                }),
            };
        }));
    };

    const commissionRate = (restaurant?.commission_bps ?? 1500) / 10000;
    const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

    const exportMenuForPartner = () => {
        const rate = commissionRate;
        const commissionPct = (rate * 100).toFixed(1);
        const dateStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

        const productRows = products.map((p: any) => {
            const cocina = Number(p.price) / (1 + rate);
            const plataforma = Number(p.price);
            const available = p.is_available;

            const modifierBlocks = p.modifier_groups?.map((g: any) => {
                const modRows = g.modifiers?.map((m: any) => `
                    <tr class="mod-row">
                        <td class="mod-name">${m.name}</td>
                        <td class="mod-price">${Number(m.price_delta) > 0 ? '+' + fmt(Number(m.price_delta)) : '<span class="included">Incluido</span>'}</td>
                    </tr>`).join('') ?? '';
                return `
                <div class="modifier-group">
                    <div class="group-label">${g.name} <span class="group-type">${g.selection_type === 'single' ? 'Elige 1' : 'Selección múltiple'}</span></div>
                    <table class="mod-table"><tbody>${modRows}</tbody></table>
                </div>`;
            }).join('') ?? '';

            return `
            <div class="product-card ${available ? '' : 'unavailable'}">
                <div class="product-header">
                    <div class="product-info">
                        <span class="product-name">${p.name}</span>
                        <span class="product-type">${p.type}</span>
                        ${available ? '' : '<span class="badge-unavailable">No disponible</span>'}
                    </div>
                    <div class="product-prices">
                        <div class="price-block">
                            <span class="price-label">Tu precio (cocina)</span>
                            <span class="price-cocina">${fmt(cocina)}</span>
                        </div>
                        <div class="price-divider">→</div>
                        <div class="price-block">
                            <span class="price-label">Precio plataforma (cliente paga)</span>
                            <span class="price-platform">${fmt(plataforma)}</span>
                        </div>
                    </div>
                </div>
                ${modifierBlocks ? `<div class="modifiers">${modifierBlocks}</div>` : ''}
            </div>`;
        }).join('');

        const availableCount = products.filter((p: any) => p.is_available).length;
        const unavailableCount = products.length - availableCount;

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Revisión de menú — ${restaurant.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; color: #1a1a2e; }

  .page { max-width: 860px; margin: 0 auto; background: white; min-height: 100vh; }

  /* Header */
  .header { background: linear-gradient(135deg, #e4007c 0%, #8b00ff 100%); color: white; padding: 32px 40px; }
  .header-top { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
  .logo { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 3px solid rgba(255,255,255,0.3); }
  .logo-placeholder { width: 64px; height: 64px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; }
  .header-title { flex: 1; }
  .header-title h1 { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
  .header-title p { font-size: 14px; opacity: 0.85; }
  .header-meta { display: flex; gap: 24px; flex-wrap: wrap; }
  .meta-item { background: rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 14px; text-align: center; }
  .meta-item .val { font-size: 20px; font-weight: 800; display: block; }
  .meta-item .lbl { font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Notice */
  .notice { background: #fff8e1; border-left: 4px solid #f59e0b; padding: 16px 24px; margin: 0; }
  .notice p { font-size: 13px; color: #92400e; line-height: 1.6; }
  .notice strong { color: #78350f; }

  /* Products */
  .products { padding: 24px 32px; }
  .section-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }

  .product-card { border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 16px; overflow: hidden; transition: all 0.2s; }
  .product-card.unavailable { opacity: 0.55; border-style: dashed; }

  .product-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; gap: 16px; background: #fafafa; }
  .product-info { flex: 1; min-width: 0; }
  .product-name { font-size: 15px; font-weight: 700; color: #111827; display: block; margin-bottom: 3px; }
  .product-type { font-size: 11px; color: #9ca3af; text-transform: capitalize; background: #f3f4f6; padding: 2px 8px; border-radius: 20px; }
  .badge-unavailable { font-size: 11px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 20px; margin-left: 6px; font-weight: 600; }

  .product-prices { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .price-block { text-align: center; }
  .price-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; display: block; margin-bottom: 2px; }
  .price-cocina { font-size: 18px; font-weight: 800; color: #111827; display: block; }
  .price-platform { font-size: 18px; font-weight: 800; color: #e4007c; display: block; }
  .price-divider { color: #d1d5db; font-size: 18px; font-weight: 300; }

  /* Modifiers */
  .modifiers { padding: 0 18px 14px; background: white; }
  .modifier-group { margin-top: 10px; }
  .group-label { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 6px; display: flex; align-items: center; gap-6px; }
  .group-type { font-size: 10px; font-weight: 500; color: white; background: #7c3aed; padding: 2px 7px; border-radius: 20px; margin-left: 8px; }
  .mod-table { width: 100%; border-collapse: collapse; }
  .mod-row td { padding: 5px 10px; font-size: 12px; border-bottom: 1px solid #f9fafb; }
  .mod-name { color: #4b5563; }
  .mod-price { text-align: right; font-weight: 600; color: #e4007c; width: 100px; }
  .included { color: #9ca3af; font-weight: 500; }

  /* Price legend */
  .legend { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 20px; margin: 0 32px 24px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7280; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-cocina { background: #111827; }
  .dot-platform { background: #e4007c; }

  /* Confirmation */
  .confirmation { margin: 0 32px 40px; border: 2px dashed #d1d5db; border-radius: 12px; padding: 24px; background: #f9fafb; }
  .confirmation h3 { font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 12px; }
  .confirmation p { font-size: 13px; color: #6b7280; margin-bottom: 16px; line-height: 1.6; }
  .signature-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 20px; }
  .sig-block { border-top: 1.5px solid #374151; padding-top: 8px; }
  .sig-block p { font-size: 11px; color: #9ca3af; }

  /* Footer */
  .footer { text-align: center; padding: 20px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #9ca3af; }

  @media print {
    body { background: white; }
    .page { box-shadow: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-top">
      ${restaurant.logo_url
        ? `<img src="${restaurant.logo_url}" alt="logo" class="logo">`
        : `<div class="logo-placeholder">🍽</div>`}
      <div class="header-title">
        <h1>${restaurant.name}</h1>
        <p>Revisión de precios y menú · ${dateStr}</p>
      </div>
    </div>
    <div class="header-meta">
      <div class="meta-item"><span class="val">${products.length}</span><span class="lbl">Productos</span></div>
      <div class="meta-item"><span class="val">${availableCount}</span><span class="lbl">Disponibles</span></div>
      ${unavailableCount > 0 ? `<div class="meta-item"><span class="val">${unavailableCount}</span><span class="lbl">No disponibles</span></div>` : ''}
      <div class="meta-item"><span class="val">${commissionPct}%</span><span class="lbl">Comisión plataforma</span></div>
    </div>
  </div>

  <!-- Notice -->
  <div class="notice">
    <p>🔎 <strong>Instrucciones para el socio:</strong> Por favor revisa cuidadosamente cada producto y sus precios.
    La columna <strong>"Tu precio (cocina)"</strong> es el monto que recibirás por cada venta.
    La columna <strong>"Precio plataforma"</strong> es lo que verá y pagará el cliente en la app.
    Si algún precio es incorrecto, indícalo antes de confirmar.</p>
  </div>

  <!-- Legend -->
  <div style="padding: 0 32px; margin-top: 20px;">
    <div class="legend">
      <div class="legend-item"><div class="dot dot-cocina"></div> <strong>Tu precio (cocina):</strong> lo que recibes tú</div>
      <div class="legend-item"><div class="dot dot-platform"></div> <strong>Precio plataforma:</strong> precio cocina + ${commissionPct}% comisión = lo que paga el cliente</div>
    </div>
  </div>

  <!-- Products -->
  <div class="products">
    <div class="section-title">📋 Lista de productos y extras</div>
    ${productRows}
  </div>

  <!-- Confirmation -->
  <div class="confirmation">
    <h3>✅ Confirmación del socio</h3>
    <p>
      He revisado todos los productos, precios y extras listados en este documento y confirmo que la información es correcta.
      Entiendo que el precio plataforma es el que verán los clientes en la aplicación Doña Repartos.
    </p>
    <div class="signature-row">
      <div class="sig-block"><p>Firma del socio</p></div>
      <div class="sig-block"><p>Nombre y puesto</p></div>
      <div class="sig-block"><p>Fecha de confirmación</p></div>
    </div>
  </div>

  <div class="footer">Generado por Doña Repartos · Sistema Administrativo · ${dateStr}</div>
</div>

<script>
  // Auto-open print dialog
  window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
  };
</script>
</body>
</html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e4007c]"></div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurante no encontrado</h2>
                    <Link href="/admin/restaurants" className="text-[#e4007c] hover:underline mt-4 inline-block">
                        Volver a la lista
                    </Link>
                </div>
            </div>
        );
    }

    const completionPercentage = restaurant.profile_completion_percentage || 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

            {/* ── Header / Navigation ── */}
            <div className="mb-6 sm:mb-8">
                <Link
                    href="/admin/restaurants"
                    className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#e4007c] dark:hover:text-[#e4007c] mb-5 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver a Restaurantes
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Title + badges */}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                            {restaurant.name}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {/* Status pill */}
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                restaurant.status === 'approved'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : restaurant.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                                {restaurant.status === 'approved' ? 'Aprobado' : restaurant.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                            </span>
                            {/* Online pill */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                                restaurant.online
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                                <span className={`h-2.5 w-2.5 rounded-full ${restaurant.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {restaurant.online ? 'En línea' : 'Desconectado'}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 sm:shrink-0">
                        {/* Toggle online/offline */}
                        <button
                            onClick={handleToggleOnline}
                            disabled={togglingOnline}
                            className={`inline-flex items-center px-4 py-2.5 rounded-xl border text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-60 ${
                                restaurant.online
                                    ? 'border-green-500 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 focus:ring-green-500'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-[#e4007c]'
                            }`}
                        >
                            {togglingOnline
                                ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                                : restaurant.online
                                    ? <Wifi className="-ml-1 mr-2 h-4 w-4" />
                                    : <WifiOff className="-ml-1 mr-2 h-4 w-4" />
                            }
                            {restaurant.online ? 'Poner Offline' : 'Poner Online'}
                        </button>

                        {restaurant.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c] transition-colors"
                                >
                                    <XCircle className="-ml-1 mr-2 h-4 w-4 text-red-500" />
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('approved')}
                                    className="inline-flex items-center px-4 py-2.5 rounded-xl border border-transparent text-sm font-semibold text-white bg-[#e4007c] hover:bg-[#c20069] active:bg-[#a30058] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c] transition-colors"
                                >
                                    <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                                    Aprobar
                                </button>
                            </>
                        )}
                        {restaurant.status === 'approved' && (
                            <button
                                onClick={() => handleStatusUpdate('rejected')}
                                className="inline-flex items-center px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-sm font-semibold text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <XCircle className="-ml-1 mr-2 h-4 w-4" />
                                Suspender
                            </button>
                        )}
                        {restaurant.status === 'rejected' && (
                            <button
                                onClick={() => handleStatusUpdate('approved')}
                                className="inline-flex items-center px-4 py-2.5 rounded-xl border border-transparent text-sm font-semibold text-white bg-[#e4007c] hover:bg-[#c20069] active:bg-[#a30058] transition-colors"
                            >
                                <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                                Reactivar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* ── Left Column ── */}
                <div className="md:col-span-2 space-y-6">

                    {/* General Info Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-gray-400" />
                                Información General
                            </h3>
                        </div>
                        <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Descripción</h4>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white leading-relaxed">
                                    {restaurant.description || 'Sin descripción'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Tipo de Cocina</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                                        {restaurant.cuisine_type || 'No especificado'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Productos</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {productsCount} registrados
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location & Contact Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                                Ubicación y Contacto
                            </h3>
                        </div>
                        <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Dirección</h4>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{restaurant.address || 'Sin dirección'}</p>
                                        </div>
                                    </div>
                                    {restaurant.location_place_id && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">Place ID: {restaurant.location_place_id}</p>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <Phone className="h-5 w-5 text-gray-400 mr-2 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Teléfono</h4>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{restaurant.phone || 'No registrado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <User className="h-5 w-5 text-gray-400 mr-2 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Propietario</h4>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{restaurant.owner?.name || 'Desconocido'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{restaurant.owner?.email}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{restaurant.owner?.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operations Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <Utensils className="h-5 w-5 mr-2 text-gray-400" />
                                Operaciones
                            </h3>
                        </div>
                        <div className="px-4 py-4 sm:px-6 sm:py-5">
                            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
                                <div>
                                    <dt className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                                        <Navigation className="h-3.5 w-3.5" /> Radio Entrega
                                    </dt>
                                    <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{restaurant.delivery_radius_km} km</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5" /> Pedido Mínimo
                                    </dt>
                                    <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">${restaurant.min_order_amount}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> Tiempo Est.
                                    </dt>
                                    <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{restaurant.estimated_delivery_time_minutes} min</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                                        <FileText className="h-3.5 w-3.5" /> Total Pedidos
                                    </dt>
                                    <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{ordersCount}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                                        <Percent className="h-3.5 w-3.5" /> Comisión
                                    </dt>
                                    <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{restaurant.commission_bps ? restaurant.commission_bps / 100 : 0}%</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* ── Menú / Productos ── */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#e4007c]/10 via-[#e4007c]/5 to-transparent">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Utensils className="h-5 w-5 text-[#e4007c]" />
                                    Menú del Restaurante
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({products.length} productos)</span>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                                        <Percent className="h-3 w-3 text-[#e4007c]" />
                                        Comisión: <span className="font-bold text-[#e4007c] ml-0.5">{((restaurant?.commission_bps ?? 1500) / 100).toFixed(1)}%</span>
                                    </div>
                                    {products.length > 0 && (
                                        <button
                                            onClick={exportMenuForPartner}
                                            title="Exportar menú para revisión del socio"
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-[#e4007c] hover:text-[#e4007c] transition-all shadow-sm"
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Exportar para socio
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Column headers */}
                            <div className="mt-3 grid grid-cols-[1fr_100px_120px_52px] gap-2 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                <span>Producto</span>
                                <span className="text-right">Precio cocina</span>
                                <span className="text-right text-[#e4007c]">Precio plataforma</span>
                                <span className="text-center">Activo</span>
                            </div>
                        </div>

                        {products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                                <Package className="h-10 w-10 mb-3 opacity-40" />
                                <p className="text-sm">Sin productos registrados</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {products.map((product: any) => {
                                    // product.price IS the platform price stored in DB
                                    const platformPrice = Number(product.price);
                                    const cocinaPrice = platformPrice / (1 + commissionRate);
                                    const isToggling = togglingProductId === product.id;
                                    const isExpanded = expandedProducts.has(product.id);
                                    const hasModifiers = product.modifier_groups?.length > 0;

                                    return (
                                        <div key={product.id} className={`transition-colors ${product.is_available ? '' : 'opacity-50 bg-gray-50 dark:bg-gray-900/20'}`}>
                                            <div className="grid grid-cols-[1fr_100px_120px_52px] gap-2 items-center px-4 sm:px-6 py-3">
                                                {/* Name + image */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                            <Utensils className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-xs text-gray-400 capitalize">{product.type}</span>
                                                            {hasModifiers && (
                                                                <button
                                                                    onClick={() => toggleExpanded(product.id)}
                                                                    className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                                                >
                                                                    {product.modifier_groups.length} extras
                                                                    {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cocina price — editable (derived from platform price) */}
                                                <div className="text-right">
                                                    {editingPriceId === product.id ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-gray-400">$</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.50"
                                                                    value={editingPriceValue}
                                                                    onChange={e => setEditingPriceValue(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') savePrice(product.id);
                                                                        if (e.key === 'Escape') cancelEditingPrice();
                                                                    }}
                                                                    autoFocus
                                                                    className="w-20 text-right text-sm font-semibold border border-[#e4007c] rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4007c]/30"
                                                                />
                                                            </div>
                                                            {/* Live platform price preview */}
                                                            {editingPriceValue && !isNaN(parseFloat(editingPriceValue)) && (
                                                                <p className="text-xs text-[#e4007c]/80">
                                                                    → {fmtMXN(parseFloat(editingPriceValue) * (1 + commissionRate))}
                                                                </p>
                                                            )}
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => savePrice(product.id)}
                                                                    disabled={savingPriceId === product.id}
                                                                    className="text-xs px-2 py-0.5 bg-[#e4007c] text-white rounded-md hover:bg-[#c8006e] disabled:opacity-50"
                                                                >
                                                                    {savingPriceId === product.id ? '...' : '✓'}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditingPrice}
                                                                    className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-300"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEditingPrice(product)}
                                                            className="group text-right"
                                                            title="Editar precio cocina"
                                                        >
                                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-[#e4007c] transition-colors">
                                                                {fmtMXN(cocinaPrice)}
                                                            </p>
                                                            <p className="text-xs text-gray-400 group-hover:text-[#e4007c]/60 transition-colors">
                                                                cocina ✎
                                                            </p>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Platform price — stored directly in products.price */}
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[#e4007c]">
                                                        {editingPriceId === product.id && editingPriceValue && !isNaN(parseFloat(editingPriceValue))
                                                            ? fmtMXN(parseFloat(editingPriceValue) * (1 + commissionRate))
                                                            : fmtMXN(platformPrice)
                                                        }
                                                    </p>
                                                    <p className="text-xs text-gray-400">plataforma</p>
                                                </div>

                                                {/* Toggle */}
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleToggleProduct(product.id, product.is_available)}
                                                        disabled={isToggling}
                                                        title={product.is_available ? 'Desactivar producto' : 'Activar producto'}
                                                        className="transition-transform hover:scale-110 disabled:opacity-50"
                                                    >
                                                        {isToggling ? (
                                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                                        ) : product.is_available ? (
                                                            <ToggleRight className="w-7 h-7 text-green-500" />
                                                        ) : (
                                                            <ToggleLeft className="w-7 h-7 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Modifier groups expandable */}
                                            {hasModifiers && isExpanded && (
                                                <div className="px-4 sm:px-6 pb-3 ml-14 space-y-2">
                                                    {product.modifier_groups.map((group: any) => (
                                                        <div key={group.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{group.name}</span>
                                                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full capitalize">
                                                                    {group.selection_type === 'single' ? 'Elige 1' : 'Múltiple'}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                {group.modifiers?.map((mod: any) => (
                                                                    <ModifierPriceCard
                                                                        key={mod.id}
                                                                        mod={mod}
                                                                        productId={product.id}
                                                                        groupId={group.id}
                                                                        onSaved={handleModifierSaved}
                                                                        onDeleted={handleModifierDeleted}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Business Hours Editor */}
                    <BusinessHoursEditor
                        restaurantId={id}
                        initialHours={restaurant.business_hours}
                        initialEnabled={restaurant.business_hours_enabled ?? false}
                        timezone={restaurant.timezone ?? 'America/Mexico_City'}
                        onSaved={(hours, enabled) =>
                            setRestaurant({ ...restaurant, business_hours: hours, business_hours_enabled: enabled })
                        }
                    />

                    {/* Recent Orders Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-gray-400" />
                                Pedidos Recientes
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                        <th className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                                        <th className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                        <th className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {recentOrders.length > 0 ? recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                #{order.id.slice(0, 8)}
                                            </td>
                                            <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {order.client?.name || 'Anónimo'}
                                            </td>
                                            <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                                ${order.total_amount}
                                            </td>
                                            <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap">
                                                <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                                No hay pedidos registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 sm:px-6 bg-gray-50 dark:bg-gray-900/50 text-right">
                            <Link href="/admin/orders" className="text-sm font-medium text-[#e4007c] hover:text-[#c20069] hover:underline transition-colors">
                                Ver todos los pedidos →
                            </Link>
                        </div>
                    </div>

                </div>

                {/* ── Right Column ── */}
                <div className="space-y-6">

                    {/* God Mode Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-[#e4007c]/50 dark:border-[#e4007c]/40">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-[#e4007c]/20 dark:border-[#e4007c]/20 bg-gradient-to-r from-[#e4007c]/10 via-[#e4007c]/5 to-transparent">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap className="h-5 w-5 text-[#e4007c]" />
                                God Mode — Controles
                            </h3>
                        </div>
                        <div className="px-4 py-4 sm:px-6 sm:py-5 divide-y divide-gray-100 dark:divide-gray-700 space-y-0">

                            {/* Online toggle */}
                            <div className="pb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Estado Online</p>
                                    <p className={`text-sm mt-0.5 font-medium ${restaurant.online ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {restaurant.online ? '● Visible para clientes' : '○ No visible'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {restaurant.business_hours_enabled ? '⏱ Horario automático activo' : '✋ Control manual'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleOnline}
                                    disabled={togglingOnline}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 ${
                                        restaurant.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                                    {togglingOnline
                                        ? <Loader2 className="h-4 w-4 text-white animate-spin mx-auto" />
                                        : <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${restaurant.online ? 'translate-x-6' : 'translate-x-1'}`} />
                                    }
                                </button>
                            </div>

                            {/* Commission editor */}
                            <div className="pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                        <Percent className="h-4 w-4 text-[#e4007c]" />
                                        Comisión
                                    </p>
                                    {!editingCommission ? (
                                        <button
                                            onClick={() => setEditingCommission(true)}
                                            className="text-sm font-medium text-[#e4007c] hover:text-[#c20069] hover:underline transition-colors"
                                        >
                                            Editar
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveCommission}
                                                disabled={savingCommission}
                                                className="text-xs font-semibold text-white bg-[#e4007c] hover:bg-[#c20069] px-3 py-1 rounded-lg disabled:opacity-50 transition-colors"
                                            >
                                                {savingCommission ? '...' : 'Guardar'}
                                            </button>
                                            <button
                                                onClick={() => { setEditingCommission(false); setCommissionBps(restaurant.commission_bps ?? 1500); }}
                                                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {editingCommission ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0" max="3000" step="50"
                                            value={commissionBps}
                                            onChange={e => setCommissionBps(Number(e.target.value))}
                                            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">bps</span>
                                        <span className="text-sm font-bold text-[#e4007c]">= {(commissionBps / 100).toFixed(1)}%</span>
                                    </div>
                                ) : (
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {((restaurant.commission_bps ?? 1500) / 100).toFixed(1)}%
                                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">{restaurant.commission_bps ?? 1500} bps</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-white dark:from-green-900/10 dark:to-gray-800">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                                Resumen Financiero
                            </h3>
                        </div>
                        <div className="px-4 py-4 sm:px-6 sm:py-5">
                            <div className="mb-3">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Balance Actual</span>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    ${accountBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <AlertTriangle className="h-4 w-4 mr-1.5 text-yellow-500 shrink-0" />
                                Pendiente por liquidar
                            </div>
                        </div>
                    </div>

                    {/* Progress Tracker Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#e4007c]/10 via-[#e4007c]/5 to-transparent">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                Progreso de Registro
                            </h3>
                        </div>
                        <div className="px-4 py-4 sm:px-6 sm:py-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Completado</span>
                                <span className="text-sm font-bold text-[#e4007c]">{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-5">
                                <div
                                    className="bg-[#e4007c] h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>

                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Paso de Onboarding</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{restaurant.onboarding_step} / 6</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Status</span>
                                    <span className={`font-semibold ${restaurant.onboarding_completed ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                        {restaurant.onboarding_completed ? 'Finalizado' : 'En proceso'}
                                    </span>
                                </li>
                            </ul>

                            {completionPercentage < 100 && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                                    <div className="flex gap-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                                            El restaurante aún no ha completado todos los pasos obligatorios para estar activo.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Images Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <ImageIcon className="h-5 w-5 mr-2 text-gray-400" />
                                Imágenes
                            </h3>
                        </div>
                        <div className="p-4 sm:p-5 grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Portada</p>
                                {restaurant.cover_image_url ? (
                                    <OptimizedImage src={restaurant.cover_image_url} alt="Cover" className="w-full h-36 object-cover rounded-xl border border-gray-200 dark:border-gray-700" priority />
                                ) : (
                                    <div className="w-full h-36 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-sm border border-gray-200 dark:border-gray-600">
                                        Sin imagen
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Logo</p>
                                {restaurant.logo_url ? (
                                    <OptimizedImage src={restaurant.logo_url} alt="Logo" className="w-full h-24 object-contain bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-xs border border-gray-200 dark:border-gray-600">Sin logo</div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">Fachada</p>
                                {restaurant.facade_image_url ? (
                                    <OptimizedImage src={restaurant.facade_image_url} alt="Fachada" className="w-full h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-xs border border-gray-200 dark:border-gray-600">Sin fachada</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Docs Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-gray-400" />
                                Documentación
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[
                                { label: 'Permiso de Negocio', url: restaurant.business_permit_url },
                                { label: 'Permiso de Salubridad', url: restaurant.health_permit_url },
                                { label: 'Menú (Imagen/PDF)', url: restaurant.menu_image_url },
                            ].map(({ label, url }) => (
                                <li key={label} className="px-4 py-3.5 sm:px-6 flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0 truncate">{label}</span>
                                    {url ? (
                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                            className="text-sm font-medium text-[#e4007c] hover:text-[#c20069] hover:underline shrink-0 transition-colors">
                                            Ver →
                                        </a>
                                    ) : (
                                        <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full shrink-0">Faltante</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    );
}
