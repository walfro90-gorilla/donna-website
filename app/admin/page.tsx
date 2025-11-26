
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Package
} from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import RecentOrdersWidget from '@/components/admin/RecentOrdersWidget';
import ExportReportsWidget from '@/components/admin/ExportReportsWidget';

interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalCouriers: number;
  totalOrders: number;
  pendingRestaurants: number;
  pendingCouriers: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRestaurants: 0,
    totalCouriers: 0,
    totalOrders: 0,
    pendingRestaurants: 0,
    pendingCouriers: 0,
    totalRevenue: 0,
    ordersToday: 0,
    revenueToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Parallelize fetching for performance
      const [
        { count: usersCount },
        { count: restaurantsCount },
        { count: couriersCount },
        { count: ordersCount },
        { count: pendingRestaurantsCount },
        { count: pendingCouriersCount },
        { data: revenueData },
        { count: ordersTodayCount },
        { data: revenueTodayData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('delivery_agent_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('delivery_agent_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total_amount').eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('orders').select('total_amount').eq('status', 'delivered').gte('created_at', todayISO)
      ]);

      const totalRevenue = revenueData?.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0) || 0;
      const revenueToday = revenueTodayData?.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalRestaurants: restaurantsCount || 0,
        totalCouriers: couriersCount || 0,
        totalOrders: ordersCount || 0,
        pendingRestaurants: pendingRestaurantsCount || 0,
        pendingCouriers: pendingCouriersCount || 0,
        totalRevenue,
        ordersToday: ordersTodayCount || 0,
        revenueToday,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 text-center text-muted-foreground">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Dashboard General</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Ingresos Totales"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="text-green-500"
          subtext="Ventas completadas"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Pedidos Totales"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="text-blue-500"
          subtext={`${stats.ordersToday} hoy`}
        />
        <StatsCard
          title="Usuarios Activos"
          value={stats.totalUsers}
          icon={Users}
          color="text-indigo-500"
        />
        <StatsCard
          title="Ingresos Hoy"
          value={formatCurrency(stats.revenueToday)}
          icon={TrendingUp}
          color="text-purple-500"
          subtext={`${stats.ordersToday} pedidos`}
        />
      </div>

      {/* Operational Status */}
      <h2 className="text-lg font-medium text-foreground mb-4">Estado Operativo</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-card overflow-hidden shadow rounded-lg border-l-4 border-yellow-400 dark:border-yellow-500">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Restaurantes Pendientes</p>
                <p className="text-2xl font-semibold text-foreground">{stats.pendingRestaurants}</p>
              </div>
              <Store className="h-8 w-8 text-yellow-400 dark:text-yellow-500" />
            </div>
            <div className="mt-4">
              <div className="text-sm">
                <a href="/admin/restaurants" className="font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300">
                  Ver solicitudes &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg border-l-4 border-orange-400 dark:border-orange-500">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Repartidores Pendientes</p>
                <p className="text-2xl font-semibold text-foreground">{stats.pendingCouriers}</p>
              </div>
              <Bike className="h-8 w-8 text-orange-400 dark:text-orange-500" />
            </div>
            <div className="mt-4">
              <div className="text-sm">
                <a href="/admin/couriers" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300">
                  Ver solicitudes &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Restaurantes Activos</p>
                <p className="text-2xl font-semibold text-foreground">{stats.totalRestaurants - stats.pendingRestaurants}</p>
              </div>
              <Store className="h-8 w-8 text-blue-400 dark:text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentOrdersWidget />

        {/* Platform Stats Summary */}
        <div className="bg-card shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">
              Resumen de la Plataforma
            </h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Total Restaurantes</dt>
                <dd className="text-sm font-semibold text-foreground">{stats.totalRestaurants}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Total Repartidores</dt>
                <dd className="text-sm font-semibold text-foreground">{stats.totalCouriers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Total Clientes</dt>
                <dd className="text-sm font-semibold text-foreground">{stats.totalUsers}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                <dt className="text-sm font-medium text-muted-foreground">Pedidos Completados</dt>
                <dd className="text-sm font-semibold text-foreground">{stats.totalOrders}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Ingresos Totales</dt>
                <dd className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(stats.totalRevenue)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Export Reports Section */}
      <div className="mb-8">
        <ExportReportsWidget />
      </div>
    </div>
  );
}
