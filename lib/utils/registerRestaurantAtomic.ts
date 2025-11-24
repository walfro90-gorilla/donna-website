// lib/utils/registerRestaurantAtomic.ts
// Implementación que sigue exactamente el flujo de la app móvil

import type { SupabaseClient } from '@supabase/supabase-js';

export interface RestaurantRegistrationData {
  restaurantName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  lat: number;
  lon: number;
  placeId?: string;
  addressStructured?: any;
}

export interface RegistrationResult {
  success: boolean;
  error?: string;
  userId?: string;
  restaurantId?: string;
  accountId?: string;
}

/**
 * Registra un restaurante siguiendo el FLUJO EXACTO de la app móvil:
 * PASO 1: Crear usuario en auth.users con signUp
 * PASO 2: Ejecutar RPC atómica register_restaurant_atomic
 */
export async function registerRestaurantAtomic(
  supabase: SupabaseClient,
  data: RestaurantRegistrationData
): Promise<RegistrationResult> {
  try {
    console.log('🚀 Iniciando registro de restaurante...');

    // PASO 1: Crear usuario en auth.users (igual que la app móvil)
    console.log('📝 PASO 1: Creando usuario en auth.users...');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.ownerName,
          phone: data.phone,
          address: data.address,
          role: 'restaurant',
          lat: data.lat,
          lon: data.lon,
          address_structured: data.addressStructured
        },
        emailRedirectTo: `${window.location.origin}/confirm`
      }
    });

    if (authError) {
      console.error('❌ Error en auth.signUp:', authError);

      if (authError.message.includes('User already registered')) {
        return { success: false, error: 'Este correo electrónico ya está registrado.' };
      }

      if (authError.message.includes('Password should be at least')) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
      }

      if (authError.message.includes('Invalid email')) {
        return { success: false, error: 'El formato del correo electrónico no es válido.' };
      }

      throw authError;
    }

    if (!authData.user) {
      return { success: false, error: 'No se pudo crear la cuenta de usuario.' };
    }

    const userId = authData.user.id;
    console.log('✅ Usuario creado en auth.users:', userId);

    // PASO 2: Ejecutar RPC atómica (igual que la app móvil)
    console.log('🔧 PASO 2: Ejecutando RPC register_restaurant_atomic...');

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'register_restaurant_atomic',
      {
        p_user_id: userId,
        p_email: data.email,
        p_name: data.ownerName,
        p_restaurant_name: data.restaurantName,
        p_phone: data.phone,
        p_address: data.address,
        p_location_lat: data.lat,
        p_location_lon: data.lon,
        p_location_place_id: data.placeId || null,
        p_address_structured: data.addressStructured || null
      }
    );

    if (rpcError) {
      console.error('❌ Error en RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcData || !rpcData.success) {
      const errorMsg = rpcData?.error || 'Error desconocido en el registro';
      console.error('❌ RPC falló:', errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('✅ Restaurante registrado exitosamente:', {
      userId,
      restaurantId: rpcData.restaurant_id,
      accountId: rpcData.account_id
    });

    return {
      success: true,
      userId,
      restaurantId: rpcData.restaurant_id,
      accountId: rpcData.account_id
    };

  } catch (error: unknown) {
    console.error('💥 Error inesperado en registro:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    // Mapear errores comunes
    if (errorMessage.includes('already registered')) {
      return { success: false, error: 'Este correo electrónico ya está registrado.' };
    }

    if (errorMessage.includes('already exists')) {
      return { success: false, error: 'Este nombre de restaurante ya existe.' };
    }

    if (errorMessage.includes('User not found')) {
      return { success: false, error: 'Error creando usuario. Intenta de nuevo.' };
    }

    return {
      success: false,
      error: 'Hubo un error al procesar tu registro. Por favor, intenta de nuevo.'
    };
  }
}