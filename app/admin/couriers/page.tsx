'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { updateCourierStatus } from './actions';
import {
    Search, Bike, CheckCircle, XCircle, PauseCircle,
    UserX, RotateCcw, MoreVertical, ChevronRight
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';

type CourierStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'inactive';

interface Courier {
    user_id: string;
    status: CourierStatus;
    account_state: string | null;
    profile_image_url: string | null;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    created_at: string;
    users: { name: string | null; email: string | null; phone: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    suspended: 'Suspendido',
    inactive: 'Inactivo',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const ACCOUNT_STATE_LABELS: Record<string, string> = {
    pending: 'Cuenta pendiente',
    active: 'Activa',
    suspended: 'Suspendida',
    terminated: 'Dada de baja',
};

const ACCOUNT_STATE_COLORS: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-500',
    active: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-500',
    suspended: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-500',
    terminated: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-500',
};

// Actions available per current status
const ACTIONS_BY_STATUS: Record<CourierStatus, { label: string; icon: React.ReactNode; newStatus: CourierStatus; danger?: boolean }[]> = {
    pending: [
        { label: 'Aprobar', icon: <CheckCircle className="h-4 w-4" />, newStatus: 'approved' },
        { label: 'Rechazar', icon: <XCircle className="h-4 w-4" />, newStatus: 'rejected', danger: true },
    ],
    approved: [
        { label: 'Suspender', icon: <PauseCircle className="h-4 w-4" />, newStatus: 'suspended', danger: true },
        { label: 'Dar de baja', icon: <UserX className="h-4 w-4" />, newStatus: 'inactive', danger: true },
    ],
    suspended: [
        { label: 'Reactivar', icon: <CheckCircle className="h-4 w-4" />, newStatus: 'approved' },
        { label: 'Dar de baja', icon: <UserX className="h-4 w-4" />, newStatus: 'inactive', danger: true },
    ],
    rejected: [
        { label: 'Reconsiderar', icon: <RotateCcw className="h-4 w-4" />, newStatus: 'pending' },
    ],
    inactive: [
        { label: 'Reactivar', icon: <RotateCcw className="h-4 w-4" />, newStatus: 'approved' },
    ],
};

export default function AdminCouriersPage() {
    const router = useRouter();
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | CourierStatus>('all');
    const [search, setSearch] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const menuRef = useRef<HTMLDivElement>(null);

    const PAGE_SIZE = 20;

    useEffect(() => {
        fetchCouriers();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchCouriers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('delivery_agent_profiles')
                .select(`
                    user_id, status, account_state, profile_image_url,
                    vehicle_type, vehicle_plate, created_at,
                    users:user_id (name, email, phone)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCouriers((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching couriers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId: string, newStatus: CourierStatus, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const labels: Record<string, string> = {
            approved: 'aprobar', rejected: 'rechazar', suspended: 'suspender',
            inactive: 'dar de baja a', pending: 'reconsiderar',
        };
        if (!confirm(`¿Confirmas ${labels[newStatus] || 'cambiar'} este repartidor?`)) return;

        setOpenMenuId(null);
        const { error } = await updateCourierStatus(userId, newStatus);
        if (error) {
            alert(`Error al actualizar el estado: ${error}`);
            return;
        }
        setCouriers(prev => prev.map(c => c.user_id === userId ? { ...c, status: newStatus } : c));
    };

    const counts = {
        pending: couriers.filter(c => c.status === 'pending').length,
        approved: couriers.filter(c => c.status === 'approved').length,
        rejected: couriers.filter(c => c.status === 'rejected').length,
        suspended: couriers.filter(c => c.status === 'suspended').length,
        inactive: couriers.filter(c => c.status === 'inactive').length,
    };

    const handleFilterChange = (key: 'all' | CourierStatus) => {
        setFilter(filter === key ? 'all' : key);
        setPage(1);
    };

    const filtered = couriers.filter(c => {
        const matchesFilter = filter === 'all' || c.status === filter;
        const matchesSearch = !search ||
            c.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.users?.phone?.includes(search);
        return matchesFilter && matchesSearch;
    });

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statCards = [
        { key: 'pending', label: 'Pendientes', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30' },
        { key: 'approved', label: 'Aprobados', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' },
        { key: 'suspended', label: 'Suspendidos', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30' },
        { key: 'rejected', label: 'Rechazados', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' },
        { key: 'inactive', label: 'Inactivos', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Repartidores</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Gestiona el estado, documentación y actividad de todos los repartidores.
                    </p>
                </div>
            </div>

            {/* Stats bar */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {statCards.map(({ key, label, color, bg }) => (
                    <button
                        key={key}
                        onClick={() => handleFilterChange(key)}
                        className={`rounded-lg border p-3 text-left transition-all ${bg} ${filter === key ? 'ring-2 ring-[#e4007c]' : 'hover:opacity-80'}`}
                    >
                        <div className={`text-2xl font-bold ${color}`}>{counts[key]}</div>
                        <div className={`text-xs font-medium mt-0.5 ${color} opacity-80`}>{label}</div>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-[#e4007c] focus:border-[#e4007c] focus:outline-none"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as any)}
                    className="block w-full sm:w-48 pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#e4007c] focus:border-[#e4007c] focus:outline-none rounded-md"
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobados</option>
                    <option value="suspended">Suspendidos</option>
                    <option value="rejected">Rechazados</option>
                    <option value="inactive">Inactivos</option>
                </select>
            </div>

            {/* Table */}
            <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sm:pl-6">Repartidor</th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehículo</th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Contacto</th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-gray-400">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e4007c] border-t-transparent" />
                                        Cargando...
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-gray-400 dark:text-gray-500">
                                    No se encontraron repartidores
                                </td>
                            </tr>
                        ) : (
                            paginated.map(courier => {
                                const actions = ACTIONS_BY_STATUS[courier.status] || [];
                                return (
                                    <tr
                                        key={courier.user_id}
                                        onClick={() => router.push(`/admin/couriers/${courier.user_id}`)}
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        {/* Name + avatar */}
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 flex-shrink-0">
                                                    {courier.profile_image_url ? (
                                                        <img className="h-9 w-9 rounded-full object-cover" src={courier.profile_image_url} alt="" />
                                                    ) : (
                                                        <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                            <Bike className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{courier.users?.name || 'Sin nombre'}</div>
                                                    <div className="text-xs text-gray-400">ID: {courier.user_id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <div className="text-gray-900 dark:text-white capitalize">{courier.vehicle_type || '—'}</div>
                                            <div className="text-xs text-gray-400">{courier.vehicle_plate || ''}</div>
                                        </td>

                                        {/* Contact */}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm hidden md:table-cell">
                                            <div className="text-gray-900 dark:text-white">{courier.users?.email}</div>
                                            <div className="text-xs text-gray-400">{courier.users?.phone}</div>
                                        </td>

                                        {/* Status */}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[courier.status] || STATUS_COLORS.inactive}`}>
                                                    {STATUS_LABELS[courier.status] || courier.status}
                                                </span>
                                                {courier.account_state && courier.account_state !== 'active' && (
                                                    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs ${ACCOUNT_STATE_COLORS[courier.account_state] || ''}`}>
                                                        {ACCOUNT_STATE_LABELS[courier.account_state] || courier.account_state}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm sm:pr-6" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1" ref={openMenuId === courier.user_id ? menuRef : undefined}>
                                                <button
                                                    onClick={() => router.push(`/admin/couriers/${courier.user_id}`)}
                                                    className="p-1 text-gray-400 hover:text-[#e4007c] transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>

                                                {actions.length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === courier.user_id ? null : courier.user_id); }}
                                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>

                                                        {openMenuId === courier.user_id && (
                                                            <div className="absolute right-0 z-10 mt-1 w-44 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1">
                                                                {actions.map(action => (
                                                                    <button
                                                                        key={action.newStatus}
                                                                        onClick={e => handleStatusUpdate(courier.user_id, action.newStatus, e)}
                                                                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${action.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}
                                                                    >
                                                                        {action.icon}
                                                                        {action.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={filtered.length}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
