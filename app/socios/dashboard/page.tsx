// app/socios/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';

export const metadata = {
  title: 'Panel de Restaurante - Doña Repartos',
  description: 'Panel de control para restaurantes',
};

async function getRestaurantData() {
  const supabase = await createClient();

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!userData || userData.role !== 'restaurant') {
    redirect('/login');
  }

  // Get user preferences for tour status
  const { data: userPrefs } = await supabase
    .from('user_preferences')
    .select('has_seen_tour')
    .eq('user_id', session.user.id)
    .single();

  return {
    user: userData,
    hasSeenTour: userPrefs?.has_seen_tour ?? false,
    stats: {
      todayOrders: 0,
      monthOrders: 0,
      revenue: 0,
      rating: 0,
    },
  };
}

import DashboardTour from '@/components/tour/DashboardTour';

export default async function RestaurantDashboard() {
  const { user, stats, hasSeenTour } = await getRestaurantData();

  return (
    <DashboardLayout
      userEmail={user.email}
      userRole="restaurant"
      userName={user.full_name}
    >
      <DashboardTour hasSeenTour={hasSeenTour} userName={user.full_name || user.email} />
      <div className="space-y-6">
        {/* Welcome Section */}
        <div id="dashboard-welcome">
          <h2 className="text-3xl font-bold text-gray-900">
            Panel de Restaurante
          </h2>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user.full_name || user.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pedidos Hoy"
            value={stats.todayOrders}
            color="pink"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Pedidos del Mes"
            value={stats.monthOrders}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          />
          <StatCard
            title="Ingresos del Mes"
            value={`$${stats.revenue.toLocaleString()}`}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Calificación"
            value={stats.rating > 0 ? `${stats.rating}/5` : 'N/A'}
            color="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
        </div>

        {/* Main Content */}
        <div id="dashboard-orders" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pedidos Recientes
          </h3>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay pedidos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Los pedidos aparecerán aquí cuando los clientes realicen órdenes.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
