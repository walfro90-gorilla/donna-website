'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import RestaurantProfileForm from '@/components/forms/RestaurantProfileForm';
import RestaurantDocumentsForm from '@/components/forms/RestaurantDocumentsForm';
import RestaurantSettingsForm from '@/components/forms/RestaurantSettingsForm';
import ProductList from '@/components/menu/ProductList';
import { LoadingSpinner } from '@/components/ui';

type Tab = 'profile' | 'documents' | 'settings' | 'menu';

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    console.log('RestaurantDashboard: Mounted');
    setMounted(true);
    debugConnection();
  }, []);

  const debugConnection = async () => {
    console.log('DEBUG: Starting connection test...');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));

    try {
      // Test 1: Simple Count (Head)
      const countPromise = supabase.from('restaurants').select('*', { count: 'exact', head: true });
      const result = await Promise.race([countPromise, timeoutPromise]);
      console.log('DEBUG: Connection Test Success (Head):', result);
    } catch (e) {
      console.error('DEBUG: Connection Test Failed (Head):', e);
    }

    try {
      // Test 2: Select Single ID
      if (user?.id) {
        const selectPromise = supabase.from('restaurants').select('id').eq('user_id', user.id).maybeSingle();
        const result = await Promise.race([selectPromise, timeoutPromise]);
        console.log('DEBUG: Connection Test Success (Select):', result);
      }
    } catch (e) {
      console.error('DEBUG: Connection Test Failed (Select):', e);
    }
  };

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
    }
  }, [user, loading, router, mounted, restaurantId]);

  const fetchRestaurantId = async () => {
    if (!user?.id) return;

    console.log('RestaurantDashboard: fetchRestaurantId started for user', user.id);

    // Add timeout to the actual fetch
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch Timeout')), 10000));

    try {
      const fetchPromise = supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('RestaurantDashboard: Error fetching restaurant ID:', error);
      }

      if (data) {
        console.log('RestaurantDashboard: Restaurant ID found', data.id);
        setRestaurantId(data.id);
      } else {
        console.log('RestaurantDashboard: No restaurant data found for user');
      }
    } catch (e) {
      console.error('RestaurantDashboard: fetchRestaurantId CRITICAL ERROR (Timeout?):', e);
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Restaurante
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user.name || user.email}
              </span>
              <div className="w-8 h-8 bg-[#e4007c] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 -mb-px overflow-x-auto">
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