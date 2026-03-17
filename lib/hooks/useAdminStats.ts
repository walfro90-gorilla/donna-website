"use client";
import useSWR from "swr";
import { supabase } from "@/lib/supabase/client";

export interface DashboardStats {
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

export interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  restaurants: { name: string } | null;
  client: { name: string } | null;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  is_read: boolean;
}

export interface AdminDashboardData {
  stats: DashboardStats;
  chartData: {
    revenue: { date: string; revenue: number }[];
    orders: { name: string; value: number }[];
  };
  recentOrders: RecentOrder[];
  notifications: AdminNotification[];
}

const ACTIVE_STATUSES = [
  "pending", "confirmed", "preparing", "in_preparation",
  "ready_for_pickup", "assigned", "picked_up", "on_the_way", "in_transit",
];

async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  // 2 queries en lugar de 15 — el RPC consolida todos los conteos y agregaciones
  const [
    { data: rpc, error: rpcError },
    { data: notificationsData },
  ] = await Promise.all([
    supabase.rpc("get_admin_dashboard_stats"),
    supabase
      .from("admin_notifications")
      .select("*")
      .eq("target_role", "admin")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Si el RPC no está disponible aún, hacer fallback a queries individuales
  if (rpcError || !rpc) {
    console.warn("RPC get_admin_dashboard_stats no disponible, usando fallback:", rpcError?.message);
    return fetchAdminDashboardDataFallback(notificationsData || []);
  }

  // Construir gráfica de ingresos: rellenar días sin ventas con 0
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const revenueByDayMap: Record<string, number> = {};
  (rpc.revenue_by_day || []).forEach((d: { date: string; revenue: number }) => {
    revenueByDayMap[d.date] = Number(d.revenue);
  });
  const revenueChartData = last7Days.map((date) => ({
    date,
    revenue: revenueByDayMap[date] ?? 0,
  }));

  // Construir gráfica de estatus de pedidos
  const sc: Record<string, number> = rpc.orders_status_counts || {};
  const ordersChartData = [
    { name: "Completados", value: sc["delivered"] || 0 },
    { name: "Pendientes", value: sc["pending"] || 0 },
    {
      name: "En Proceso",
      value: ACTIVE_STATUSES
        .filter((s) => s !== "pending")
        .reduce((sum, s) => sum + (sc[s] || 0), 0),
    },
    { name: "Cancelados", value: (sc["cancelled"] || 0) + (sc["canceled"] || 0) },
  ];

  return {
    stats: {
      totalUsers:           Number(rpc.total_users)          || 0,
      totalRestaurants:     Number(rpc.total_restaurants)    || 0,
      totalCouriers:        Number(rpc.total_couriers)       || 0,
      totalOrders:          Number(rpc.total_orders)         || 0,
      pendingRestaurants:   Number(rpc.pending_restaurants)  || 0,
      pendingCouriers:      Number(rpc.pending_couriers)     || 0,
      totalRevenue:         Number(rpc.revenue_30d)          || 0,
      ordersToday:          Number(rpc.orders_today)         || 0,
      revenueToday:         Number(rpc.revenue_today)        || 0,
      onlineRestaurants:    Number(rpc.online_restaurants)   || 0,
      approvedCouriers:     Number(rpc.approved_couriers)    || 0,
      activeOrders:         Number(rpc.active_orders)        || 0,
      unreadNotifications:  notificationsData?.length        || 0,
    },
    chartData: { revenue: revenueChartData, orders: ordersChartData },
    recentOrders: (rpc.recent_orders || []) as RecentOrder[],
    notifications: (notificationsData as AdminNotification[]) || [],
  };
}

// Fallback: queries individuales para cuando el RPC aún no está en Supabase
async function fetchAdminDashboardDataFallback(
  notificationsData: AdminNotification[],
): Promise<AdminDashboardData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysISO = thirtyDaysAgo.toISOString();

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
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase.from("delivery_agent_profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("delivery_agent_profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("total_amount, created_at").eq("status", "delivered").gte("created_at", thirtyDaysISO),
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("orders").select("total_amount").eq("status", "delivered").gte("created_at", todayISO),
    supabase.from("orders").select("status").gte("created_at", thirtyDaysISO),
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("online", true),
    supabase.from("delivery_agent_profiles").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ACTIVE_STATUSES),
    supabase.from("orders")
      .select("id, status, total_amount, created_at, restaurants(name), client:users!orders_user_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalRevenue = revenueData?.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0;
  const revenueToday = revenueTodayData?.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const revenueChartData = last7Days.map((date) => ({
    date,
    revenue: revenueData?.filter((o) => o.created_at.startsWith(date))
      .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0) || 0,
  }));

  const statusCounts = allOrders?.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ordersChartData = [
    { name: "Completados", value: statusCounts?.["delivered"] || 0 },
    { name: "Pendientes", value: statusCounts?.["pending"] || 0 },
    {
      name: "En Proceso",
      value: ACTIVE_STATUSES.filter((s) => s !== "pending")
        .reduce((sum, s) => sum + (statusCounts?.[s] || 0), 0),
    },
    { name: "Cancelados", value: (statusCounts?.["cancelled"] || 0) + (statusCounts?.["canceled"] || 0) },
  ];

  return {
    stats: {
      totalUsers: usersCount || 0, totalRestaurants: restaurantsCount || 0,
      totalCouriers: couriersCount || 0, totalOrders: ordersCount || 0,
      pendingRestaurants: pendingRestaurantsCount || 0, pendingCouriers: pendingCouriersCount || 0,
      totalRevenue, ordersToday: ordersTodayCount || 0, revenueToday,
      onlineRestaurants: onlineRestaurantsCount || 0, approvedCouriers: approvedCouriersCount || 0,
      activeOrders: activeOrdersCount || 0, unreadNotifications: notificationsData?.length || 0,
    },
    chartData: { revenue: revenueChartData, orders: ordersChartData },
    recentOrders: ((recentOrdersData as unknown) as RecentOrder[]) || [],
    notifications: (notificationsData as AdminNotification[]) || [],
  };
}

export function useAdminStats() {
  return useSWR<AdminDashboardData>("admin-dashboard-stats", fetchAdminDashboardData, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
    revalidateOnReconnect: true,
  });
}
