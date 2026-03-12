'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle, XCircle, Eye, Store, Wifi } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/admin/Pagination';
import { updateRestaurantStatus } from './actions';

const PAGE_SIZE = 20;

export default function AdminRestaurantsPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('id, name, cuisine_type, status, online, average_rating, logo_url, users:user_id (email, phone)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (e: React.MouseEvent, id: string, newStatus: 'approved' | 'rejected') => {
        e.stopPropagation(); // prevent row click navigation
        const { error } = await updateRestaurantStatus(id, newStatus);
        if (error) { alert('Error: ' + error); return; }
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    };

    const filtered = restaurants.filter(r => {
        const matchesFilter = filter === 'all' || r.status === filter;
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.users?.email?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const counts = {
        all: restaurants.length,
        pending: restaurants.filter(r => r.status === 'pending').length,
        approved: restaurants.filter(r => r.status === 'approved').length,
        rejected: restaurants.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Restaurantes</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {filtered.length} restaurantes. Haz clic en una fila para ver el perfil completo y administrarlo.
                    </p>
                </div>
            </div>

            {/* Status quick-filter badges */}
            <div className="mt-6 flex flex-wrap gap-2">
                {([
                    { key: 'all', label: 'Todos', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' },
                    { key: 'pending', label: 'Pendientes', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' },
                    { key: 'approved', label: 'Aprobados', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
                    { key: 'rejected', label: 'Rechazados', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' },
                ] as const).map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => { setFilter(key); setPage(1); }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${color} ${filter === key ? 'ring-2 ring-offset-1 ring-[#e4007c]' : 'opacity-70 hover:opacity-100'}`}
                    >
                        {label}
                        <span className="bg-white/40 dark:bg-black/20 rounded-full px-1.5">{counts[key]}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="relative rounded-md shadow-sm max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-[#e4007c] focus:border-[#e4007c] block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md p-2 border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Buscar restaurante o email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="mt-6 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Restaurante</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Contacto</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Online</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Rating</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</td></tr>
                                    ) : paginated.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No se encontraron restaurantes</td></tr>
                                    ) : (
                                        paginated.map((restaurant) => (
                                            <tr
                                                key={restaurant.id}
                                                onClick={() => router.push(`/admin/restaurants/${restaurant.id}`)}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                            >
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 flex-shrink-0">
                                                            {restaurant.logo_url ? (
                                                                <img className="h-9 w-9 rounded-full object-cover" src={restaurant.logo_url} alt="" />
                                                            ) : (
                                                                <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                    <Store className="h-4 w-4 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{restaurant.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{restaurant.cuisine_type || '—'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div>{restaurant.users?.email || '—'}</div>
                                                    <div className="text-xs">{restaurant.users?.phone || '—'}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                        restaurant.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        restaurant.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {restaurant.status === 'approved' ? 'Aprobado' : restaurant.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${restaurant.online ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        <div className={`h-2 w-2 rounded-full ${restaurant.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                                        {restaurant.online ? 'Online' : 'Offline'}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="text-yellow-400">★</span>
                                                    <span className="ml-1 text-gray-900 dark:text-white">{restaurant.average_rating?.toFixed(1) || '—'}</span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <div className="flex justify-end gap-2 items-center" onClick={e => e.stopPropagation()}>
                                                        {restaurant.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => handleStatusUpdate(e, restaurant.id, 'approved')}
                                                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                                    title="Aprobar"
                                                                >
                                                                    <CheckCircle className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleStatusUpdate(e, restaurant.id, 'rejected')}
                                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                    title="Rechazar"
                                                                >
                                                                    <XCircle className="h-5 w-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <Eye className="h-4 w-4 text-[#e4007c]" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
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
                </div>
            </div>
        </div>
    );
}
