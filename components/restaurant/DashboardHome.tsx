
import React from 'react';
import { CompletionCard } from '@/components/onboarding/CompletionCard';

interface DashboardHomeProps {
    restaurantName: string;
    checklistItems?: any[];
    checklistCompletion?: number;
    stats?: {
        ordersToday: number;
        totalSales: number;
        rating: number;
        recentOrders: any[];
        weeklySales: any[];
        topProducts: any[];
    };
    onboardingStatus?: {
        percentage: number;
        missingFields: {
            key: string;
            label: string;
            href?: string;
        }[];
    };
    onNavigateToField?: (fieldKey: string) => void;
    isStoreOpen?: boolean;
    onToggleStoreStatus?: () => void;
}

export default function DashboardHome({
    restaurantName,
    stats,
    onboardingStatus,
    onNavigateToField,
    isStoreOpen,
    onToggleStoreStatus
}: DashboardHomeProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
        return `Hace ${Math.floor(diffInMinutes / 1440)} d`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
            case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
            case 'preparing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50';
            case 'ready_for_pickup': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50';
            case 'picked_up': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50';
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendiente',
            confirmed: 'Confirmado',
            preparing: 'Preparando',
            ready_for_pickup: 'Listo',
            picked_up: 'En camino',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section with Store Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border transition-colors duration-200">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Hola, <span className="text-[#e4007c]">{restaurantName || 'Socio'}</span> 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">Resumen de actividad en tiempo real.</p>
                </div>

                <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-xl border border-border">
                    <span className={`text-sm font-medium ${isStoreOpen ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        {isStoreOpen ? 'Tienda Abierta' : 'Tienda Cerrada'}
                    </span>
                    <button
                        onClick={onToggleStoreStatus}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 focus:ring-offset-background ${isStoreOpen ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isStoreOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Stats Grid - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Orders Card */}
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md hover:border-border/80 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full border border-green-100 dark:border-green-500/20">Hoy</span>
                        </div>
                        <h3 className="text-muted-foreground text-sm font-medium">Pedidos Totales</h3>
                        <p className="text-3xl font-bold text-foreground mt-1">{stats?.ordersToday || 0}</p>
                    </div>
                </div>

                {/* Sales Card */}
                <div className="bg-gradient-to-br from-[#e4007c] to-[#b00060] p-6 rounded-2xl shadow-lg shadow-pink-500/20 dark:shadow-none border border-transparent text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl text-white backdrop-blur-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-white/80 text-sm font-medium">Ventas Totales</h3>
                        <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats?.totalSales || 0)}</p>
                    </div>
                </div>

                {/* Rating Card */}
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md hover:border-border/80 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 dark:bg-yellow-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-500/10 rounded-xl text-yellow-600 dark:text-yellow-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Promedio</span>
                        </div>
                        <h3 className="text-muted-foreground text-sm font-medium">Calificación</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-3xl font-bold text-foreground">{stats?.rating?.toFixed(1) || 'N/A'}</p>
                            <div className="flex text-yellow-400 text-sm">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-4 h-4 ${i < Math.round(stats?.rating || 0) ? 'fill-current' : 'text-muted-foreground/30 fill-current'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Onboarding / Completion Card */}
                    {onboardingStatus && onboardingStatus.percentage < 100 && (
                        <CompletionCard
                            percentage={onboardingStatus.percentage}
                            missingFields={onboardingStatus.missingFields}
                            role="restaurant"
                            onFieldClick={onNavigateToField}
                        />
                    )}

                    {/* Recent Orders Table */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-foreground text-lg">Pedidos Recientes</h3>
                            <button className="text-sm text-[#e4007c] font-medium hover:text-[#b00060]">Ver todos</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-6 py-4">ID Pedido</th>
                                        <th className="px-6 py-4">Cliente/Dirección</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                                        stats.recentOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                                                    <div className="text-xs text-muted-foreground mt-1">{formatTimeAgo(order.created_at)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-foreground">Cliente</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{order.delivery_address || 'Sin dirección'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-foreground">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                No hay pedidos recientes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Weekly Sales Chart (CSS Only) */}
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                        <h3 className="font-bold text-foreground mb-6">Ventas Semanales</h3>
                        <div className="flex items-end justify-between h-40 gap-2">
                            {stats?.weeklySales?.map((day, index) => (
                                <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-muted/50 rounded-t-lg relative h-32 flex items-end overflow-hidden">
                                        <div
                                            className="w-full bg-[#e4007c] opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out rounded-t-lg"
                                            style={{ height: `${Math.random() * 80 + 10}%` }} // Mock height for visual as data is 0
                                        ></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                        <h3 className="font-bold text-foreground mb-4">Productos Top</h3>
                        <div className="space-y-4">
                            {stats?.topProducts?.map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.count} vendidos</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{formatCurrency(product.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
