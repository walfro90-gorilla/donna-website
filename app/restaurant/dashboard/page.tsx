
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import RestaurantProfileForm from '@/components/forms/RestaurantProfileForm';
import RestaurantDocumentsForm from '@/components/forms/RestaurantDocumentsForm';
import RestaurantSettingsForm from '@/components/forms/RestaurantSettingsForm';
import ProductList from '@/components/menu/ProductList';
import DashboardHome from '@/components/restaurant/DashboardHome';
import { LoadingSpinner } from '@/components/ui';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { markRestaurantWelcomeAsSeen } from '@/app/actions/onboarding';
import { calculateRestaurantProgress } from '@/lib/utils/onboarding';

type Tab = 'home' | 'profile' | 'documents' | 'settings' | 'menu';

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState({
    ordersToday: 0,
    totalSales: 0,
    rating: 0,
    recentOrders: [] as any[],
    weeklySales: [] as any[],
    topProducts: [] as any[]
  });
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  useEffect(() => {
    console.log('RestaurantDashboard: Mounted');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    console.log('RestaurantDashboard: Auth State Update', { user: user?.id, role: user?.role, loading, restaurantId });

    if (!loading && !user) {
      console.log('RestaurantDashboard: No user, redirecting to login');
      router.push('/login');
      return;
    }

    if (user && user.role !== 'restaurant') {
      console.log('RestaurantDashboard: User is not restaurant, redirecting');
      router.push('/login');
      return;
    }

    if (user && !restaurantId) {
      console.log('RestaurantDashboard: Fetching restaurant ID');
      fetchRestaurantId();
      fetchPreferences();
    }
  }, [user, loading, router, mounted, restaurantId]);

  const fetchPreferences = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('user_preferences')
      .select('has_seen_restaurant_welcome')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setHasSeenWelcome(data.has_seen_restaurant_welcome);
    } else {
      setHasSeenWelcome(false);
    }
  };

  const fetchRestaurantId = async () => {
    if (!user?.id) return;

    console.log('RestaurantDashboard: fetchRestaurantId started for user', user.id);

    try {
      // Fetch all fields needed for progress calculation
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('RestaurantDashboard: Error fetching restaurant ID:', error);
      }

      if (data) {
        console.log('RestaurantDashboard: Restaurant ID found', data.id);
        setRestaurantId(data.id);
        setRestaurantData(data);
        setIsStoreOpen(data.online || false);
        setOnboardingStatus(calculateRestaurantProgress(data));
      } else {
        console.log('RestaurantDashboard: No restaurant data found for user');
      }
    } catch (e) {
      console.error('RestaurantDashboard: fetchRestaurantId error:', e);
    }
  };

  const fetchDashboardStats = async (id: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch orders today
    const { count: ordersTodayCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', id)
      .gte('created_at', todayISO);

    // Fetch total sales (completed orders)
    const { data: salesData, error: salesError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('restaurant_id', id)
      .eq('status', 'delivered'); // Assuming 'delivered' is the completed status

    const totalSales = salesData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

    // Fetch recent orders
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, status, user_id, delivery_address')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Mock Weekly Sales Data (Since we might not have enough historical data yet)
    // In a real scenario, we would query orders grouped by day for the last 7 days
    const weeklySales = [
      { day: 'Lun', amount: 0 },
      { day: 'Mar', amount: 0 },
      { day: 'Mié', amount: 0 },
      { day: 'Jue', amount: 0 },
      { day: 'Vie', amount: 0 },
      { day: 'Sáb', amount: 0 },
      { day: 'Dom', amount: 0 },
    ];

    // Mock Top Products (We would query order_items joined with products)
    const topProducts = [
      { name: 'Hamburguesa Clásica', count: 12, revenue: 1800 },
      { name: 'Papas Fritas', count: 25, revenue: 1250 },
      { name: 'Refresco', count: 30, revenue: 900 },
    ];

    setDashboardStats({
      ordersToday: ordersTodayCount || 0,
      totalSales: totalSales,
      rating: restaurantData?.average_rating || 0,
      recentOrders: recentOrders || [],
      weeklySales,
      topProducts
    });
  };

  const toggleStoreStatus = async () => {
    if (!restaurantId) return;
    const newStatus = !isStoreOpen;
    setIsStoreOpen(newStatus);

    const { error } = await supabase
      .from('restaurants')
      .update({ online: newStatus })
      .eq('id', restaurantId);

    if (error) {
      console.error('Error updating store status:', error);
      setIsStoreOpen(!newStatus); // Revert on error
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchDashboardStats(restaurantId);
    }
  }, [restaurantId]);

  const handleWelcomeClose = async () => {
    await markRestaurantWelcomeAsSeen();
    setHasSeenWelcome(true);
  };

  const handleNavigateToField = (fieldKey: string) => {
    if (['name', 'description', 'address', 'phone', 'logo_url', 'cover_image_url', 'cuisine_type'].includes(fieldKey)) {
      setActiveTab('profile');
    } else if (['business_hours'].includes(fieldKey)) {
      setActiveTab('settings');
    } else if (['business_permit_url', 'health_permit_url'].includes(fieldKey)) {
      setActiveTab('documents');
    } else {
      setActiveTab('profile'); // Default
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e4007c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'restaurant') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingModal
        isOpen={!hasSeenWelcome}
        onClose={handleWelcomeClose}
        role="restaurant"
        userName={user.name || 'Socio'}
      />

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Restaurante
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'home'
                ? 'border-[#e4007c] text-[#e4007c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'profile'
                ? 'border-[#e4007c] text-[#e4007c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Perfil del Negocio
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'menu'
                ? 'border-[#e4007c] text-[#e4007c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Menú Digital
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'documents'
                ? 'border-[#e4007c] text-[#e4007c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Documentación
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'settings'
                ? 'border-[#e4007c] text-[#e4007c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Configuración
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <DashboardHome
            restaurantName={restaurantData?.name}
            stats={dashboardStats}
            onboardingStatus={onboardingStatus}
            onNavigateToField={handleNavigateToField}
            isStoreOpen={isStoreOpen}
            onToggleStoreStatus={toggleStoreStatus}
          />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Completa la información de tu perfil para que los clientes puedan encontrarte.
                  </p>
                </div>
              </div>
            </div>
            <RestaurantProfileForm />
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            {restaurantId ? (
              <ProductList restaurantId={restaurantId} />
            ) : (
              <div className="text-center py-12">
                <LoadingSpinner isLoading={true} />
                <p className="mt-2 text-gray-500">Cargando información del restaurante...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Es necesario subir estos documentos para verificar tu cuenta y comenzar a vender.
                  </p>
                </div>
              </div>
            </div>
            <RestaurantDocumentsForm />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <RestaurantSettingsForm />
          </div>
        )}
      </div>
    </div>
  );
}