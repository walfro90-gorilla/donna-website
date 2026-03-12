'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, Eye } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
    in_preparation: 'En preparación', ready_for_pickup: 'Listo para recoger',
    assigned: 'Asignado', picked_up: 'Recogido', on_the_way: 'En camino',
    in_transit: 'En tránsito', delivered: 'Entregado', cancelled: 'Cancelado',
    canceled: 'Cancelado', not_delivered: 'No entregado',
};

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          restaurants (name),
          client:users!orders_user_id_fkey (name, email),
          courier:users!orders_delivery_agent_id_fkey (name)
        `)
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesFilter = filter === 'all' || o.status === filter;
        const matchesSearch = o.id.includes(search) ||
            o.restaurants?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.client?.name?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelled': case 'canceled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'preparing': case 'in_preparation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'on_the_way': case 'in_transit': case 'picked_up': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'not_delivered': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Pedidos</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Historial completo · {filteredOrders.length} pedidos. Haz clic en un pedido para ver detalles y administrarlo.
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
                        className="focus:ring-[#e4007c] focus:border-[#e4007c] block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md p-2 border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="Buscar pedido, restaurante o cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] sm:text-sm rounded-md border"
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Preparando</option>
                    <option value="in_preparation">En preparación</option>
                    <option value="ready_for_pickup">Listo para recoger</option>
                    <option value="assigned">Asignado</option>
                    <option value="on_the_way">En camino</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="not_delivered">No entregado</option>
                </select>
            </div>

            {/* Table */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">ID Pedido</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Restaurante</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Cliente</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Repartidor</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Ver</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</td>
                                        </tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">No se encontraron pedidos</td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                onClick={() => router.push(`/admin/orders/${order.id}`)}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                            >
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono font-medium text-gray-900 dark:text-white sm:pl-6">
                                                    #{order.id.slice(0, 8)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {order.restaurants?.name || '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {order.client?.name || '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {order.courier?.name || <span className="text-gray-300 dark:text-gray-600 italic text-xs">Sin asignar</span>}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white font-medium">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(order.status)}`}>
                                                        {STATUS_LABELS[order.status] || order.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(order.created_at).toLocaleDateString('es-MX')}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <Eye className="h-4 w-4 text-[#e4007c] inline-block" />
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
