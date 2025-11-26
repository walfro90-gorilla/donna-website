
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface RecentOrder {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    restaurants: { name: string } | null;
    client: { name: string } | null;
}

export default function RecentOrdersWidget() {
    const [orders, setOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentOrders();
    }, []);

    const fetchRecentOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          id,
          created_at,
          total_amount,
          status,
          restaurants (name),
          client:users!orders_user_id_fkey (name)
        `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching recent orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
            case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
            case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
        }
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmado',
            'preparing': 'Preparando',
            'on_the_way': 'En camino',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    };

    return (
        <div className="bg-card shadow rounded-lg border border-border">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-foreground mb-4">
                    Pedidos Recientes
                </h3>
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Cargando...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No hay pedidos recientes</div>
                ) : (
                    <div className="flow-root">
                        <ul className="-my-5 divide-y divide-border">
                            {orders.map((order) => (
                                <li key={order.id} className="py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {order.restaurants?.name || 'Restaurante desconocido'}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                Cliente: {order.client?.name || 'Desconocido'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.created_at).toLocaleString('es-MX')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-sm font-medium text-foreground">
                                                {formatCurrency(order.total_amount)}
                                            </p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
