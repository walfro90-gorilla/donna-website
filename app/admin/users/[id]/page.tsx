'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, User, Mail, Phone, Calendar, ShoppingBag,
    AlertTriangle, DollarSign, CheckCircle, XCircle, MapPin, Star, Shield
} from 'lucide-react';
import Link from 'next/link';
import { forgivClientDebt, liftClientSuspension } from '../actions';

interface UserDetailProps {
    params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', paid: 'Pagada', forgiven: 'Perdonada', disputed: 'En disputa',
};
const DEBT_REASON_LABELS: Record<string, string> = {
    not_delivered: 'No entregado', client_no_show: 'Cliente ausente',
    fake_address: 'Dirección falsa', other: 'Otro',
};
const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', delivered: 'Entregado', cancelled: 'Cancelado',
    on_the_way: 'En camino', preparing: 'Preparando', confirmed: 'Confirmado',
};

export default function UserDetailPage({ params }: UserDetailProps) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [account, setAccount] = useState<any>(null);
    const [debts, setDebts] = useState<any[]>([]);
    const [suspension, setSuspension] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchAll(); }, [id]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [
                { data: userData },
                { data: profileData },
                { data: accountData },
                { data: debtsData },
                { data: suspensionData },
                { data: ordersData },
            ] = await Promise.all([
                supabase.from('users').select('*').eq('id', id).single(),
                supabase.from('client_profiles').select('*').eq('user_id', id).single(),
                supabase.from('accounts').select('balance').eq('user_id', id).single(),
                supabase.from('client_debts').select('*, orders(id)').eq('client_id', id).order('created_at', { ascending: false }),
                supabase.from('client_account_suspensions').select('*').eq('client_id', id).single(),
                supabase.from('orders').select('id, status, total_amount, created_at, restaurants(name)').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
            ]);
            setUser(userData);
            setProfile(profileData);
            setAccount(accountData);
            setDebts(debtsData || []);
            setSuspension(suspensionData);
            setOrders(ordersData || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgivDebt = async (debtId: string) => {
        if (!confirm('¿Perdonar esta deuda? Esta acción no se puede deshacer.')) return;
        setSaving(true);
        const { error } = await forgivClientDebt(debtId);
        setSaving(false);
        if (error) { alert('Error: ' + error); return; }
        fetchAll();
    };

    const handleLiftSuspension = async () => {
        if (!confirm('¿Levantar la suspensión de este cliente?')) return;
        setSaving(true);
        const { error } = await liftClientSuspension(id);
        setSaving(false);
        if (error) { alert('Error: ' + error); return; }
        fetchAll();
    };

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
                        </div>
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Usuario no encontrado</p>
                <Link href="/admin/users" className="text-[#e4007c] hover:underline mt-4 block">← Volver a Usuarios</Link>
            </div>
        );
    }

    const isSuspended = suspension?.is_suspended || false;
    const pendingDebts = debts.filter(d => d.status === 'pending');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users" className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <ChevronLeft className="h-4 w-4 mr-1" />Usuarios
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                {profile?.profile_image_url ? (
                                    <img src={profile.profile_image_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                                ) : (
                                    <User className="h-6 w-6 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name || 'Sin nombre'}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    {isSuspended && (
                                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                            Suspendido
                                        </span>
                                    )}
                                    {pendingDebts.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                            <AlertTriangle className="h-3 w-3" />
                                            {pendingDebts.length} deuda{pendingDebts.length !== 1 ? 's' : ''} pendiente{pendingDebts.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Perfil */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <User className="h-4 w-4 text-[#e4007c]" /> Información Personal
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{user.phone || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Registro</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                            {profile?.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Dirección guardada</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{profile.address}</p>
                                    </div>
                                </div>
                            )}
                            {profile?.average_rating > 0 && (
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Rating promedio</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{Number(profile.average_rating).toFixed(1)} / 5 ({profile.total_reviews} reseñas)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-mono text-gray-400 break-all">ID: {user.id}</p>
                        </div>
                    </div>

                    {/* Deudas */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" /> Deudas
                            </h2>
                            <span className="text-xs text-gray-400">{debts.length} total</span>
                        </div>
                        {debts.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">Sin deudas registradas</p>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {debts.map(debt => (
                                    <div key={debt.id} className="px-5 py-4 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    debt.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                    debt.status === 'forgiven' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                    {STATUS_LABELS[debt.status] || debt.status}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{DEBT_REASON_LABELS[debt.reason] || debt.reason}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(debt.created_at).toLocaleDateString('es-MX')}</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(Number(debt.amount))}</span>
                                            {debt.status === 'pending' && (
                                                <button
                                                    onClick={() => handleForgivDebt(debt.id)}
                                                    disabled={saving}
                                                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    Perdonar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pedidos recientes */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-[#e4007c]" /> Pedidos Recientes
                            </h2>
                            <Link href={`/admin/orders?client=${id}`} className="text-xs text-[#e4007c] hover:underline">Ver todos</Link>
                        </div>
                        {orders.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">Sin pedidos</p>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {orders.map(order => (
                                    <Link
                                        key={order.id}
                                        href={`/admin/orders/${order.id}`}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{order.restaurants?.name || '—'}</p>
                                            <p className="text-xs text-gray-400">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('es-MX')}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{ORDER_STATUS_LABELS[order.status] || order.status}</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-6">

                    {/* Balance */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-[#e4007c]" /> Balance
                        </h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(account?.balance || 0)}</p>
                        <p className="text-xs text-gray-400 mt-1">Saldo en cuenta</p>
                    </div>

                    {/* Suspensión */}
                    <div className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-5 ${isSuspended ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Shield className={`h-4 w-4 ${isSuspended ? 'text-red-500' : 'text-gray-400'}`} />
                            Cuenta
                        </h3>
                        {suspension ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Estado</span>
                                    <span className={`font-semibold ${isSuspended ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {isSuspended ? 'Suspendido' : 'Activo'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Intentos fallidos</span>
                                    <span className="text-gray-900 dark:text-white">{suspension.failed_attempts}</span>
                                </div>
                                {suspension.suspended_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Suspendido el</span>
                                        <span className="text-gray-900 dark:text-white">{new Date(suspension.suspended_at).toLocaleDateString('es-MX')}</span>
                                    </div>
                                )}
                                {isSuspended && (
                                    <button
                                        onClick={handleLiftSuspension}
                                        disabled={saving}
                                        className="w-full mt-3 py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#e4007c] hover:bg-[#c00068] transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Levantando...' : 'Levantar Suspensión'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" /> Sin suspensiones
                            </p>
                        )}
                    </div>

                    {/* Perfil cliente stats */}
                    {profile && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-400" /> Estadísticas
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Rating promedio</span>
                                    <span className="text-gray-900 dark:text-white">{Number(profile.average_rating || 0).toFixed(1)} ★</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Reseñas</span>
                                    <span className="text-gray-900 dark:text-white">{profile.total_reviews || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Estado perfil</span>
                                    <span className={`font-medium ${profile.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {profile.status === 'active' ? 'Activo' : profile.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
