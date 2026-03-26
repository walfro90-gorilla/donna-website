'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
    Search, CheckCircle, XCircle, Eye, Store,
    ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { updateRestaurantStatus } from './actions';

const PAGE_SIZE = 20;

type SortField = 'name' | 'status' | 'online' | 'average_rating';
type SortDir = 'asc' | 'desc';

interface StatusCounts { all: number; pending: number; approved: number; rejected: number; }
interface OnlineStats { online: number; offline: number; }

// ── Avatar with image fallback ─────────────────────────────────────────────
function RestaurantAvatar({ url, name }: { url: string | null; name: string }) {
    const [err, setErr] = useState(false);
    if (!url || err) {
        return (
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                <Store className="h-5 w-5 text-gray-400" />
            </div>
        );
    }
    return (
        <img
            src={url}
            alt={name}
            className="h-10 w-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
            onError={() => setErr(true)}
        />
    );
}

// ── Sort indicator icon ────────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDir }) {
    if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400 ml-1 flex-shrink-0" />;
    return sortDir === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 text-[#e4007c] ml-1 flex-shrink-0" />
        : <ChevronDown className="h-3.5 w-3.5 text-[#e4007c] ml-1 flex-shrink-0" />;
}

// ── Skeleton row ───────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="py-3.5 pl-4 pr-3 sm:pl-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    <div className="space-y-1.5">
                        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                </div>
            </td>
            <td className="hidden sm:table-cell px-3 py-3.5">
                <div className="space-y-1.5">
                    <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-2.5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
            </td>
            <td className="px-3 py-3.5"><div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" /></td>
            <td className="px-3 py-3.5"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" /></td>
            <td className="hidden md:table-cell px-3 py-3.5"><div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded" /></td>
            <td className="py-3.5 pl-3 pr-4 sm:pr-6" />
        </tr>
    );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminRestaurantsPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState<StatusCounts>({ all: 0, pending: 0, approved: 0, rejected: 0 });
    const [onlineStats, setOnlineStats] = useState<OnlineStats>({ online: 0, offline: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [sortField, setSortField] = useState<SortField | null>(null); // null = smart default sort
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // ── Fetch aggregated counts (status + online) ─────────────────────────
    useEffect(() => {
        (async () => {
            const [
                { count: all }, { count: pending },
                { count: approved }, { count: rejected },
                { count: online },
            ] = await Promise.all([
                supabase.from('restaurants').select('*', { count: 'exact', head: true }),
                supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
                supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('online', true),
            ]);
            setCounts({ all: all || 0, pending: pending || 0, approved: approved || 0, rejected: rejected || 0 });
            setOnlineStats({ online: online || 0, offline: (all || 0) - (online || 0) });
        })();
    }, []);

    // ── Fetch paginated list ──────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            try {
                const from = (page - 1) * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;

                let query = supabase
                    .from('restaurants')
                    .select(
                        'id, name, cuisine_type, status, online, business_hours_enabled, average_rating, logo_url, users:user_id(email, phone)',
                        { count: 'exact' },
                    )
                    .range(from, to);

                // Default smart sort: approved+online → approved+offline → pending → rejected
                if (sortField === null) {
                    query = query
                        .order('status', { ascending: true })        // approved < pending < rejected
                        .order('online', { ascending: false })        // online first within each group
                        .order('name', { ascending: true });
                } else {
                    query = query.order(sortField, {
                        ascending: sortDir === 'asc',
                        nullsFirst: false,
                    });
                }

                if (filter !== 'all') query = query.eq('status', filter);
                if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);

                const { data, count, error } = await query;
                if (error) throw error;
                if (!cancelled) {
                    setRestaurants(data || []);
                    setTotal(count || 0);
                }
            } catch (err) {
                console.error('Error fetching restaurants:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        const timer = setTimeout(run, search ? 300 : 0);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [page, filter, search, sortField, sortDir]);

    // ── Sort toggle ───────────────────────────────────────────────────────
    function handleSort(field: SortField) {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            // Sensible defaults: numeric/boolean start descending, text starts ascending
            setSortDir(field === 'online' || field === 'average_rating' ? 'desc' : 'asc');
        }
        setPage(1);
    }

    // ── Approve / reject ──────────────────────────────────────────────────
    const handleStatusUpdate = async (e: React.MouseEvent, id: string, newStatus: 'approved' | 'rejected') => {
        e.stopPropagation();
        const { error } = await updateRestaurantStatus(id, newStatus);
        if (error) { alert('Error: ' + error); return; }
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        setCounts(prev => ({
            ...prev,
            [newStatus]: prev[newStatus] + 1,
            pending: Math.max(0, prev.pending - 1),
        }));
    };

    // ── SortableHeader helper ─────────────────────────────────────────────
    const SortableHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
        <th className={`px-3 py-3 text-left ${className}`}>
            <button
                onClick={() => handleSort(field)}
                className="flex items-center text-xs font-semibold tracking-wider uppercase text-gray-600 dark:text-gray-300 hover:text-[#e4007c] dark:hover:text-[#e4007c] transition-colors"
            >
                {label}
                <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
            </button>
        </th>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurantes</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {total} restaurante{total !== 1 ? 's' : ''} · Clic en una fila para ver el perfil completo
                </p>
            </div>

            {/* ── Online/Offline monitor ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {/* Online */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Online</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{onlineStats.online}</div>
                </div>
                {/* Offline */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Offline</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">{onlineStats.offline}</div>
                </div>
                {/* Pendientes */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-2 w-2 rounded-full bg-yellow-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pendientes</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{counts.pending}</div>
                </div>
                {/* Total */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Store className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.all}</div>
                </div>
            </div>

            {/* ── Filters + Search ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex flex-wrap gap-2">
                    {([
                        { key: 'all', label: 'Todos', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' },
                        { key: 'pending', label: 'Pendientes', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' },
                        { key: 'approved', label: 'Aprobados', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
                        { key: 'rejected', label: 'Rechazados', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' },
                    ] as const).map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => { setFilter(key); setPage(1); }}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${color} ${filter === key ? 'ring-2 ring-offset-1 ring-[#e4007c]' : 'opacity-70 hover:opacity-100'}`}
                        >
                            {label}
                            <span className="bg-white/40 dark:bg-black/20 rounded-full px-1.5 text-xs">{counts[key]}</span>
                        </button>
                    ))}
                </div>
                <div className="relative sm:ml-auto sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#e4007c] focus:border-transparent outline-none transition"
                        placeholder="Buscar por nombre..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                                {/* Restaurante — sortable */}
                                <th className="py-3 pl-4 pr-3 text-left sm:pl-6">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center text-xs font-semibold tracking-wider uppercase text-gray-600 dark:text-gray-300 hover:text-[#e4007c] dark:hover:text-[#e4007c] transition-colors"
                                    >
                                        Restaurante
                                        <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                                    </button>
                                </th>
                                {/* Contacto — not sortable */}
                                <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-semibold tracking-wider uppercase text-gray-600 dark:text-gray-300">
                                    Contacto
                                </th>
                                {/* Estado — sortable */}
                                <SortableHeader field="status" label="Estado" />
                                {/* Online — sortable */}
                                <SortableHeader field="online" label="Online" />
                                {/* Rating — sortable */}
                                <SortableHeader field="average_rating" label="Rating" className="hidden md:table-cell" />
                                <th className="relative py-3 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60 bg-white dark:bg-gray-900">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : restaurants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-14 text-gray-500 dark:text-gray-400">
                                        <Store className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        No se encontraron restaurantes
                                    </td>
                                </tr>
                            ) : (
                                restaurants.map((restaurant) => (
                                    <tr
                                        key={restaurant.id}
                                        onClick={() => router.push(`/admin/restaurants/${restaurant.id}`)}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                                    >
                                        {/* Restaurant name + avatar */}
                                        <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-sm sm:pl-6">
                                            <div className="flex items-center gap-3">
                                                <RestaurantAvatar url={restaurant.logo_url} name={restaurant.name} />
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{restaurant.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">{restaurant.cuisine_type || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Contact */}
                                        <td className="hidden sm:table-cell whitespace-nowrap px-3 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                                            <div>{restaurant.users?.email || '—'}</div>
                                            <div className="text-xs mt-0.5">{restaurant.users?.phone || '—'}</div>
                                        </td>
                                        {/* Status badge */}
                                        <td className="whitespace-nowrap px-3 py-3.5 text-sm">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                restaurant.status === 'approved'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : restaurant.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {restaurant.status === 'approved' ? 'Aprobado'
                                                    : restaurant.status === 'pending' ? 'Pendiente'
                                                    : 'Rechazado'}
                                            </span>
                                        </td>
                                        {/* Online indicator */}
                                        <td className="whitespace-nowrap px-3 py-3.5 text-sm">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                                    restaurant.online ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                                                }`}>
                                                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                                        restaurant.online ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`} />
                                                    {restaurant.online ? 'Online' : 'Offline'}
                                                </span>
                                                {restaurant.business_hours_enabled && (
                                                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Auto</span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Rating */}
                                        <td className="hidden md:table-cell whitespace-nowrap px-3 py-3.5 text-sm">
                                            {restaurant.average_rating ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="text-yellow-400">★</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{restaurant.average_rating.toFixed(1)}</span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">—</span>
                                            )}
                                        </td>
                                        {/* Actions */}
                                        <td className="relative whitespace-nowrap py-3.5 pl-3 pr-4 text-right text-sm sm:pr-6">
                                            <div className="flex justify-end gap-1 items-center" onClick={e => e.stopPropagation()}>
                                                {restaurant.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleStatusUpdate(e, restaurant.id, 'approved')}
                                                            className="p-1 rounded text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                                                            title="Aprobar"
                                                        >
                                                            <CheckCircle className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleStatusUpdate(e, restaurant.id, 'rejected')}
                                                            className="p-1 rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Rechazar"
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                )}
                                                <span className="p-1">
                                                    <Eye className="h-4 w-4 text-[#e4007c]" />
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </div>
        </div>
    );
}
