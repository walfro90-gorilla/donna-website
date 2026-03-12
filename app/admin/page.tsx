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
  CheckCircle,
  Clock,
  Activity,
  Zap,
  UserCheck,
  WifiOff
} from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
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
  onlineRestaurants: number;
  approvedCouriers: number;
  activeOrders: number;
  unreadNotifications: number;
}

interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  restaurants: { name: string } | null;
  client: { name: string } | null;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  is_read: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  in_preparation: 'En preparación',
  ready_for_pickup: 'Listo para recoger',
  assigned: 'Asignado',
  picked_up: 'Recogido',
  on_the_way: 'En camino',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  not_delivered: 'No entregado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_preparation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ready_for_pickup: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  picked_up: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  on_the_way: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  not_delivered: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  registration: 'bg-blue-500',
  order: 'bg-green-500',
  system: 'bg-gray-500',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalRestaurants: 0, totalCouriers: 0, totalOrders: 0,
    pendingRestaurants: 0, pendingCouriers: 0, totalRevenue: 0,
    ordersToday: 0, revenueToday: 0, onlineRestaurants: 0,
    approvedCouriers: 0, activeOrders: 0, unreadNotifications: 0,
  });
  const [chartData, setChartData] = useState<{ revenue: { date: string; revenue: number }[]; orders: { name: string; value: number }[] }>({ revenue: [], orders: [] });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const activeStatuses = ['pending', 'confirmed', 'preparing', 'in_preparation', 'ready_for_pickup', 'assigned', 'picked_up', 'on_the_way', 'in_transit'];

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
        { data: allOrders },
        { count: onlineRestaurantsCount },
        { count: approvedCouriersCount },
        { count: activeOrdersCount },
        { data: recentOrdersData },
        { data: notificationsData },
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
        supabase.from('orders').select('status, created_at'),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('online', true),
        supabase.from('delivery_agent_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', activeStatuses),
        supabase.from('orders')
          .select('id, status, total_amount, created_at, restaurants(name), client:users!orders_user_id_fkey(name)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('admin_notifications')
          .select('*')
          .eq('target_role', 'admin')
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const totalRevenue = revenueData?.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0;
      const revenueToday = revenueTodayData?.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0;

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const revenueChartData = last7Days.map(date => ({
        date,
        revenue: revenueData?.filter(o => o.created_at.startsWith(date)).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0,
      }));

      const statusCounts = allOrders?.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ordersChartData = [
        { name: 'Completados', value: statusCounts?.['delivered'] || 0 },
        { name: 'Pendientes', value: statusCounts?.['pending'] || 0 },
        { name: 'En Proceso', value: activeStatuses.filter(s => s !== 'pending').reduce((sum, s) => sum + (statusCounts?.[s] || 0), 0) },
        { name: 'Cancelados', value: (statusCounts?.['cancelled'] || 0) + (statusCounts?.['canceled'] || 0) },
      ];

      setStats({
        totalUsers: usersCount || 0, totalRestaurants: restaurantsCount || 0,
        totalCouriers: couriersCount || 0, totalOrders: ordersCount || 0,
        pendingRestaurants: pendingRestaurantsCount || 0, pendingCouriers: pendingCouriersCount || 0,
        totalRevenue, ordersToday: ordersTodayCount || 0, revenueToday,
        onlineRestaurants: onlineRestaurantsCount || 0,
        approvedCouriers: approvedCouriersCount || 0,
        activeOrders: activeOrdersCount || 0,
        unreadNotifications: notificationsData?.length || 0,
      });
      setChartData({ revenue: revenueChartData, orders: ordersChartData });
      setRecentOrders((recentOrdersData as RecentOrder[]) || []);
      setNotifications((notificationsData as AdminNotification[]) || []);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setStats(prev => ({ ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) }));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-[#e4007c]" />
            God Mode Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control total de la plataforma en tiempo real</p>
        </div>
        <Link
          href="/admin/create-profile"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#e4007c] hover:bg-[#c00068] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c]"
        >
          <Users className="h-4 w-4 mr-2" />
          Nuevo Perfil
        </Link>
      </div>

      {/* Alertas Pendientes */}
      {(stats.pendingRestaurants > 0 || stats.pendingCouriers > 0 || notifications.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Requieren Atención</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.pendingRestaurants > 0 && (
              <Link href="/admin/restaurants" className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors">
                <Store className="h-4 w-4" />
                {stats.pendingRestaurants} restaurante{stats.pendingRestaurants !== 1 ? 's' : ''} pendiente{stats.pendingRestaurants !== 1 ? 's' : ''}
              </Link>
            )}
            {stats.pendingCouriers > 0 && (
              <Link href="/admin/couriers" className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors">
                <Bike className="h-4 w-4" />
                {stats.pendingCouriers} repartidor{stats.pendingCouriers !== 1 ? 'es' : ''} pendiente{stats.pendingCouriers !== 1 ? 's' : ''}
              </Link>
            )}
            {notifications.map(n => (
              <div key={n.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[n.category] || 'bg-gray-400'}`}></span>
                <span className="max-w-xs truncate">{n.title}</span>
                <button onClick={() => markNotificationRead(n.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1 flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Ingresos Totales" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="text-green-500" subtext="Pedidos completados" />
        <StatsCard title="Ingresos Hoy" value={formatCurrency(stats.revenueToday)} icon={TrendingUp} color="text-purple-500" subtext={`${stats.ordersToday} pedidos hoy`} />
        <StatsCard title="Pedidos Totales" value={stats.totalOrders} icon={ShoppingBag} color="text-blue-500" subtext={`${stats.activeOrders} activos ahora`} />
        <StatsCard title="Clientes Registrados" value={stats.totalUsers} icon={Users} color="text-indigo-500" />
      </div>

      {/* Estado Operativo en Tiempo Real */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#e4007c]" />
          Estado Operativo
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onlineRestaurants}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Restaurantes online</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">de {stats.totalRestaurants} totales</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approvedCouriers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Repartidores aprobados</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">de {stats.totalCouriers} registrados</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeOrders}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pedidos en curso</p>
              <Link href="/admin/orders" className="text-xs text-[#e4007c] hover:underline">Ver todos →</Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4">
            <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${stats.pendingRestaurants + stats.pendingCouriers > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <AlertCircle className={`h-6 w-6 ${stats.pendingRestaurants + stats.pendingCouriers > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingRestaurants + stats.pendingCouriers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Solicitudes pendientes</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{stats.pendingRestaurants} rest. · {stats.pendingCouriers} rep.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={chartData.revenue} />
        <OrdersChart data={chartData.orders} />
      </div>

      {/* Feed de Órdenes Recientes + Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Feed de órdenes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#e4007c]" />
              Pedidos Recientes
            </h3>
            <Link href="/admin/orders" className="text-sm text-[#e4007c] hover:underline">Ver todos →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentOrders.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Sin pedidos recientes</p>
            ) : (
              recentOrders.map(order => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {order.restaurants?.name || 'Sin restaurante'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {order.client?.name || 'Cliente'} · #{order.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-gray-400">{timeAgo(order.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Resumen plataforma */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#e4007c]" />
              Resumen Global
            </h3>
          </div>
          <dl className="px-5 py-4 space-y-4">
            {[
              { label: 'Total Restaurantes', value: stats.totalRestaurants, href: '/admin/restaurants', color: 'text-gray-900 dark:text-white' },
              { label: 'Online ahora', value: stats.onlineRestaurants, href: '/admin/restaurants', color: 'text-green-600 dark:text-green-400' },
              { label: 'Total Repartidores', value: stats.totalCouriers, href: '/admin/couriers', color: 'text-gray-900 dark:text-white' },
              { label: 'Aprobados', value: stats.approvedCouriers, href: '/admin/couriers', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Total Clientes', value: stats.totalUsers, href: '/admin/users', color: 'text-gray-900 dark:text-white' },
              { label: 'Ingresos Totales', value: formatCurrency(stats.totalRevenue), href: '/admin/balance', color: 'text-green-600 dark:text-green-400' },
            ].map((item, i) => (
              <div key={i} className={`flex justify-between items-center ${i === 1 || i === 3 ? 'pb-3 border-b border-gray-100 dark:border-gray-700' : ''}`}>
                <dt className="text-sm text-gray-500 dark:text-gray-400">{item.label}</dt>
                <dd>
                  <Link href={item.href} className={`text-sm font-semibold ${item.color} hover:underline`}>
                    {item.value}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
          <div className="px-5 pb-4">
            <Link
              href="/admin/balance"
              className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Ver Balance Completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
