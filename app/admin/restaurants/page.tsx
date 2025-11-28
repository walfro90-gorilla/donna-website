'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, Filter, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

export default function AdminRestaurantsPage() {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select(`
          *,
          users:user_id (email, phone)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setRestaurants(restaurants.map(r =>
                r.id === id ? { ...r, status: newStatus } : r
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        }
    };

    const filteredRestaurants = restaurants.filter(r => {
        const matchesFilter = filter === 'all' || r.status === filter;
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.users?.email?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-foreground">Restaurantes</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Lista de todos los restaurantes registrados en la plataforma.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    {/* Action buttons could go here */}
                </div>
            </div>

            {/* Filters */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative rounded-md shadow-sm max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-[#e4007c] focus:border-[#e4007c] block w-full pl-10 sm:text-sm border-input rounded-md p-2 border bg-background text-foreground"
                        placeholder="Buscar restaurante..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-input bg-background text-foreground focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] sm:text-sm rounded-md border"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="approved">Aprobados</option>
                        <option value="rejected">Rechazados</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border border-border">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Nombre</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Contacto</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Estado</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Rating</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-muted-foreground">Cargando...</td>
                                        </tr>
                                    ) : filteredRestaurants.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-muted-foreground">No se encontraron restaurantes</td>
                                        </tr>
                                    ) : (
                                        filteredRestaurants.map((restaurant) => (
                                            <tr key={restaurant.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            {restaurant.logo_url ? (
                                                                <img className="h-10 w-10 rounded-full object-cover" src={restaurant.logo_url} alt="" />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                                    <Store className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="font-medium text-foreground">{restaurant.name}</div>
                                                            <div className="text-muted-foreground">{restaurant.cuisine_type || 'Sin categoría'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                    <div className="text-foreground">{restaurant.users?.email}</div>
                                                    <div className="text-muted-foreground">{restaurant.phone || restaurant.users?.phone}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${restaurant.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        restaurant.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {restaurant.status === 'approved' ? 'Aprobado' :
                                                            restaurant.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <span className="text-yellow-400">★</span>
                                                        <span className="ml-1 text-foreground">{restaurant.average_rating?.toFixed(1) || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {restaurant.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleStatusUpdate(restaurant.id, 'approved')}
                                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                                title="Aprobar"
                                                            >
                                                                <CheckCircle className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(restaurant.id, 'rejected')}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                title="Rechazar"
                                                            >
                                                                <XCircle className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {restaurant.status !== 'pending' && (
                                                        <button className="text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Store(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </svg>
    )
}
