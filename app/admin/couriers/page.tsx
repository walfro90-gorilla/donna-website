'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, Filter, CheckCircle, XCircle, MoreVertical, Bike } from 'lucide-react';

export default function AdminCouriersPage() {
    const [couriers, setCouriers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCouriers();
    }, []);

    const fetchCouriers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('delivery_agent_profiles')
                .select(`
          *,
          users:user_id (name, email, phone)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCouriers(data || []);
        } catch (error) {
            console.error('Error fetching couriers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('delivery_agent_profiles')
                .update({ status: newStatus })
                .eq('user_id', userId);

            if (error) throw error;

            // Optimistic update
            setCouriers(couriers.map(c =>
                c.user_id === userId ? { ...c, status: newStatus } : c
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        }
    };

    const filteredCouriers = couriers.filter(c => {
        const matchesFilter = filter === 'all' || c.status === filter;
        const matchesSearch = c.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.users?.email?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Repartidores</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Lista de todos los repartidores registrados en la plataforma.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative rounded-md shadow-sm max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-[#e4007c] focus:border-[#e4007c] block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="Buscar repartidor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] sm:text-sm rounded-md border"
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
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vehículo</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contacto</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4">Cargando...</td>
                                        </tr>
                                    ) : filteredCouriers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4">No se encontraron repartidores</td>
                                        </tr>
                                    ) : (
                                        filteredCouriers.map((courier) => (
                                            <tr key={courier.user_id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            {courier.profile_image_url ? (
                                                                <img className="h-10 w-10 rounded-full object-cover" src={courier.profile_image_url} alt="" />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <Bike className="h-6 w-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="font-medium text-gray-900">{courier.users?.name || 'Sin nombre'}</div>
                                                            <div className="text-gray-500 text-xs">ID: {courier.user_id.slice(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="text-gray-900 capitalize">{courier.vehicle_type || 'No especificado'}</div>
                                                    <div className="text-gray-500">{courier.vehicle_plate}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="text-gray-900">{courier.users?.email}</div>
                                                    <div className="text-gray-500">{courier.users?.phone}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${courier.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            courier.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {courier.status === 'approved' ? 'Aprobado' :
                                                            courier.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {courier.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleStatusUpdate(courier.user_id, 'approved')}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="Aprobar"
                                                            >
                                                                <CheckCircle className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(courier.user_id, 'rejected')}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Rechazar"
                                                            >
                                                                <XCircle className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {courier.status !== 'pending' && (
                                                        <button className="text-gray-400 hover:text-gray-600">
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
