
import React from 'react';
import { CompletionCard } from '@/components/onboarding/CompletionCard';

interface DashboardHomeProps {
    restaurantName: string;
    checklistItems?: any[]; // Keeping optional for backward compatibility
    checklistCompletion?: number; // Keeping optional
    stats?: {
        ordersToday: number;
        totalSales: number;
        rating: number;
        recentOrders: any[];
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
}

export default function DashboardHome({ restaurantName, checklistItems, checklistCompletion, stats, onboardingStatus, onNavigateToField }: DashboardHomeProps) {
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

        if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
        if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
        return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hola, {restaurantName || 'Restaurante'} 👋</h1>
                <p className="text-gray-500">Aquí tienes el resumen de tu restaurante hoy.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Orders Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Pedidos de Hoy</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.ordersToday || 0}</p>
                </div>

                {/* Sales Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Ventas Totales</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.totalSales || 0)}</p>
                </div>

                {/* Rating Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Calificación</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.rating?.toFixed(1) || 'N/A'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checklist Column */}
                <div className="lg:col-span-2">
                    {onboardingStatus ? (
                        <CompletionCard
                            percentage={onboardingStatus.percentage}
                            missingFields={onboardingStatus.missingFields}
                            role="restaurant"
                            onFieldClick={onNavigateToField}
                        />
                    ) : (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                            Cargando estado del perfil...
                        </div>
                    )}
                </div>

                {/* Recent Activity / Notifications */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Actividad Reciente</h3>
                        <div className="space-y-4">
                            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-start space-x-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-[#e4007c]"></div>
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium">
                                                Pedido #{order.id.slice(0, 8)} - {formatCurrency(order.total_amount)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatTimeAgo(order.created_at)} • {order.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No hay actividad reciente.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
