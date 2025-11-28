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
import RevenueChart from '@/components/admin/RevenueChart';
import OrdersChart from '@/components/admin/OrdersChart';
import Link from 'next/link';

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

interface ChartData {
  revenue: { date: string; revenue: number }[];
  orders: { name: string; value: number }[];
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
  const [chartData, setChartData] = useState<ChartData>({ revenue: [], orders: [] });
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
        { data: revenueTodayData },
        { data: allOrders }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('delivery_agent_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('delivery_agent_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total_amount, created_at').eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('orders').select('total_amount').eq('status', 'delivered').gte('created_at', todayISO),
        supabase.from('orders').select('status, created_at')
      ]);

      const totalRevenue = revenueData?.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0) || 0;
      const revenueToday = revenueTodayData?.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0) || 0;

      // Process Chart Data
      // Revenue Chart (Last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const revenueChartData = last7Days.map(date => {
        const dayRevenue = revenueData
          ?.filter(o => o.created_at.startsWith(date))
          .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0;
        return { date, revenue: dayRevenue };
      });

      // Orders Chart (By Status)
      const statusCounts = allOrders?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ordersChartData = [
        { name: 'Completados', value: statusCounts?.['delivered'] || 0 },
        { name: 'Pendientes', value: statusCounts?.['pending'] || 0 },
        { name: 'En Proceso', value: (statusCounts?.['preparing'] || 0) + (statusCounts?.['on_the_way'] || 0) },
        { name: 'Cancelados', value: (statusCounts?.['cancelled'] || 0) + (statusCounts?.['canceled'] || 0) },
      ];

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

      setChartData({
        revenue: revenueChartData,
        orders: ordersChartData,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard General</h1>
        <Link
          href="/admin/create-profile"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Users className="h-5 w-5 mr-2" />
          Nuevo Perfil
        </Link>
      </div>

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueChart data={chartData.revenue} />
        <OrdersChart data={chartData.orders} />
      </div>

      {/* Operational Status */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Estado Operativo</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-card border border-border overflow-hidden shadow rounded-lg border-l-4 border-l-yellow-400 dark:border-l-yellow-500 transition-transform hover:scale-105">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Restaurantes Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingRestaurants}</p>
              </div>
              <Store className="h-8 w-8 text-yellow-400 dark:text-yellow-500" />
            </div>
            <div className="mt-4">
              <div className="text-sm">
                <Link href="/admin/restaurants" className="font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300">
                  Ver solicitudes &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border overflow-hidden shadow rounded-lg border-l-4 border-l-orange-400 dark:border-l-orange-500 transition-transform hover:scale-105">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Repartidores Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingCouriers}</p>
              </div>
              <Bike className="h-8 w-8 text-orange-400 dark:text-orange-500" />
            </div>
            <div className="mt-4">
              <div className="text-sm">
                <Link href="/admin/couriers" className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300">
                  Ver solicitudes &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border overflow-hidden shadow rounded-lg border-l-4 border-l-blue-400 dark:border-l-blue-500 transition-transform hover:scale-105">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Restaurantes Activos</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalRestaurants - stats.pendingRestaurants}</p>
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
        <div className="bg-card border border-border shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
              Resumen de la Plataforma
            </h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Restaurantes</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">{stats.totalRestaurants}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Repartidores</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">{stats.totalCouriers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clientes</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos Completados</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">{stats.totalOrders}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos Totales</dt>
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
