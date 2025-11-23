'use client';

import { DollarSign, Store, Bike, Users, Wallet } from 'lucide-react';
import { BalanceStats as BalanceStatsType } from '@/app/admin/balance/actions';

interface BalanceStatsProps {
    stats: BalanceStatsType;
}

export default function BalanceStats({ stats }: BalanceStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);
    };

    const cards = [
        {
            title: 'Balance Restaurantes',
            amount: stats.restaurants,
            icon: Store,
            gradient: 'from-blue-500 to-blue-600',
            description: 'Fondos retenidos por restaurantes',
        },
        {
            title: 'Balance Repartidores',
            amount: stats.delivery_agents,
            icon: Bike,
            gradient: 'from-orange-500 to-orange-600',
            description: 'Fondos en manos de repartidores',
        },
        {
            title: 'Deuda Clientes',
            amount: stats.clients,
            icon: Users,
            gradient: 'from-purple-500 to-purple-600',
            description: 'Pagos pendientes de clientes',
        },
        {
            title: 'Balance Plataforma',
            amount: stats.platform,
            icon: Wallet,
            gradient: 'from-green-500 to-green-600',
            description: 'Ingresos netos disponibles',
        },
    ];

    // Calculate total system balance (should ideally be 0 if double-entry is perfect, but here it's just a sum)
    const totalSystemBalance = stats.restaurants + stats.delivery_agents + stats.clients + stats.platform;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 shadow-lg text-white transform transition-all hover:scale-105 hover:shadow-xl`}
                    >
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 blur-xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                                    <card.icon className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-xs font-medium uppercase tracking-wider text-white/80">
                                    Total
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-white/90">{card.title}</h3>
                                <p className="mt-1 text-3xl font-bold tracking-tight">
                                    {formatCurrency(card.amount)}
                                </p>
                            </div>
                            <div className="mt-4 text-xs text-white/70">
                                {card.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Zero Balance Check Widget */}
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${Math.abs(totalSystemBalance) < 1 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Comprobación de Balance Cero</h4>
                        <p className="text-xs text-gray-500">Suma total de todas las cuentas del sistema</p>
                    </div>
                </div>
                <div className={`text-lg font-bold ${Math.abs(totalSystemBalance) < 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {formatCurrency(totalSystemBalance)}
                </div>
            </div>
        </div>
    );
}
