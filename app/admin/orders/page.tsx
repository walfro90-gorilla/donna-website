'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, Filter, Eye } from 'lucide-react';

export default function AdminOrdersPage() {
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
                .order('created_at', { ascending: false });

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'on_the_way': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-foreground">Pedidos</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Historial completo de pedidos en la plataforma.
                    </p>
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
                        placeholder="Buscar pedido, restaurante o cliente..."
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
                        <option value="pending">Pendiente</option>
                        <option value="preparing">Preparando</option>
                        <option value="on_the_way">En camino</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
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
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">ID Pedido</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Restaurante</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Cliente</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Total</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Estado</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Fecha</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-4 text-muted-foreground">Cargando...</td>
                                        </tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-4 text-muted-foreground">No se encontraron pedidos</td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                                    #{order.id.slice(0, 8)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                    {order.restaurants?.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                    {order.client?.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground font-medium">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button className="text-[#e4007c] hover:text-[#c00068]">
                                                        <Eye className="h-5 w-5" />
                                                    </button>
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
