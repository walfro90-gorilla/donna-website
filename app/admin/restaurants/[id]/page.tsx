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
import { toggleRestaurantOnline, updateRestaurantCommission, updateRestaurantStatus, toggleProductAvailability } from '../actions';
import { BusinessHoursEditor } from '../components/BusinessHoursEditor';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface RestaurantDetailProps {
    params: Promise<{
        id: string;
    }>;
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

    const commissionRate = (restaurant?.commission_bps ?? 1500) / 10000;
    const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

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
                            <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Utensils className="h-5 w-5 text-[#e4007c]" />
                                    Menú del Restaurante
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({products.length} productos)</span>
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                                    <Percent className="h-3 w-3 text-[#e4007c]" />
                                    Comisión: <span className="font-bold text-[#e4007c] ml-0.5">{((restaurant?.commission_bps ?? 1500) / 100).toFixed(1)}%</span>
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
                                    const platformPrice = Number(product.price) * (1 + commissionRate);
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

                                                {/* Cocina price */}
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fmtMXN(Number(product.price))}</p>
                                                    <p className="text-xs text-gray-400">cocina</p>
                                                </div>

                                                {/* Platform price */}
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[#e4007c]">{fmtMXN(platformPrice)}</p>
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
                                                                    <div key={mod.id} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 border border-gray-100 dark:border-gray-700">
                                                                        <span className="text-gray-700 dark:text-gray-300 truncate">{mod.name}</span>
                                                                        <span className={`font-semibold ml-2 flex-shrink-0 ${mod.price_delta > 0 ? 'text-[#e4007c]' : 'text-gray-400'}`}>
                                                                            {mod.price_delta > 0 ? `+${fmtMXN(mod.price_delta)}` : 'Incluido'}
                                                                        </span>
                                                                    </div>
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
