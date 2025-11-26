
import React from 'react';
import { CompletionCard } from '@/components/onboarding/CompletionCard';

interface DashboardHomeProps {
    agentName: string;
    checklistItems?: any[];
    checklistCompletion?: number;
    stats?: {
        deliveriesToday: number;
        earningsToday: number;
        rating: number;
        onlineTime: string;
    };
    currentDelivery?: {
        id: string;
        restaurantName: string;
        customerAddress: string;
        status: string;
        earnings: number;
    };
    isOnline?: boolean;
    onToggleOnline?: () => void;
    onViewDelivery?: (id: string) => void;
}

export default function DashboardHome({
    agentName,
    checklistCompletion,
    checklistItems,
    stats,
    currentDelivery,
    isOnline = false,
    onToggleOnline,
    onViewDelivery
}: DashboardHomeProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Mobile Header with Status Toggle */}
            <div className="bg-card p-5 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Hola, {agentName.split(' ')[0]}</h1>
                        <p className="text-muted-foreground text-sm">¿Listo para rodar?</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <button
                            onClick={onToggleOnline}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isOnline ? 'bg-green-500 ring-green-500' : 'bg-muted ring-muted'}`}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${isOnline ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-bold ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                            {isOnline ? 'CONECTADO' : 'DESCONECTADO'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Active Delivery Card (High Priority) */}
            {currentDelivery ? (
                <div className="bg-[#e4007c] text-white p-6 rounded-3xl shadow-xl shadow-pink-200 dark:shadow-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                EN CURSO
                            </span>
                            <span className="font-bold text-lg">{formatCurrency(currentDelivery.earnings)}</span>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{currentDelivery.restaurantName}</h3>
                        <p className="text-white/80 text-sm mb-6 truncate">{currentDelivery.customerAddress}</p>

                        <button
                            onClick={() => onViewDelivery && onViewDelivery(currentDelivery.id)}
                            className="w-full bg-white text-[#e4007c] font-bold py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Ver Detalles
                        </button>
                    </div>
                </div>
            ) : (
                isOnline && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 p-6 rounded-2xl text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500 dark:text-blue-400 animate-pulse">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                            </svg>
                        </div>
                        <h3 className="text-blue-900 dark:text-blue-300 font-bold">Buscando pedidos...</h3>
                        <p className="text-blue-600 dark:text-blue-400 text-sm">Mantente atento, te notificaremos pronto.</p>
                    </div>
                )
            )}

            {/* Earnings & Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <p className="text-muted-foreground text-xs font-bold uppercase mb-1">Ganancias Hoy</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.earningsToday || 0)}</p>
                </div>
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <p className="text-muted-foreground text-xs font-bold uppercase mb-1">Entregas</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.deliveriesToday || 0}</p>
                </div>
            </div>

            {/* Onboarding Checklist (if incomplete) */}
            {checklistCompletion !== undefined && checklistCompletion < 100 && (
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h3 className="font-bold text-foreground">Completa tu perfil</h3>
                        <div className="mt-2 w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-[#e4007c] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${checklistCompletion}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="divide-y divide-border">
                        {checklistItems?.map((item) => (
                            <button
                                key={item.id}
                                onClick={item.action}
                                className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${item.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground text-transparent'}`}>
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-medium ${item.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
