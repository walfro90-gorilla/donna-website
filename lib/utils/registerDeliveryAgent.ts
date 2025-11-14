// lib/utils/registerDeliveryAgent.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RegisterDeliveryAgentPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterDeliveryAgentResult {
  ok: boolean;
  error?: string;
  userId?: string;
}

/**
 * Registra un delivery agent siguiendo el flujo de la app Flutter:
 * 1. Crear usuario en auth.users con supabase.auth.signUp()
 * 2. Ejecutar función RPC atómica register_delivery_agent_atomic()
 */
export async function registerDeliveryAgentClient(
  supabase: SupabaseClient,
  payload: RegisterDeliveryAgentPayload
): Promise<RegisterDeliveryAgentResult> {
  try {
    // PASO 1: Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email.trim(),
      password: payload.password.trim(),
      options: {
        data: {
          name: payload.name.trim(),
          phone: payload.phone.trim(),
          role: 'repartidor', // Se normaliza a 'delivery_agent' en backend
        },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-email`
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      
      if (authError.message.includes('User already registered')) {
        return { ok: false, error: 'Este correo electrónico ya está registrado.' };
      }
      
      if (authError.message.includes('Invalid email')) {
        return { ok: false, error: 'El formato del correo electrónico no es válido.' };
      }
      
      if (authError.message.includes('Password should be at least')) {
        return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
      }
      
      return { ok: false, error: authError.message };
    }

    if (!authData.user) {
      return { ok: false, error: 'No se pudo crear la cuenta de usuario.' };
    }

    const userId = authData.user.id;

    // PASO 2: Ejecutar función RPC atómica
    const { data: rpcData, error: rpcError } = await supabase.rpc('register_delivery_agent_atomic', {
      p_user_id: userId,
      p_email: payload.email.trim(),
      p_name: payload.name.trim(),
      p_phone: payload.phone.trim(),
      p_address: null,
      p_lat: null,
      p_lon: null,
      p_address_structured: null,
      p_vehicle_type: 'motocicleta',
      p_vehicle_plate: null,
      p_vehicle_model: null,
      p_vehicle_color: null,
      p_emergency_contact_name: null,
      p_emergency_contact_phone: null,
      p_place_id: null,
      p_profile_image_url: null,
      p_id_document_front_url: null,
      p_id_document_back_url: null,
      p_vehicle_photo_url: null,
      p_vehicle_registration_url: null,
      p_vehicle_insurance_url: null,
    });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      return { 
        ok: false, 
        error: 'Error al crear el perfil de repartidor. Por favor, contacta a soporte.' 
      };
    }

    // Verificar respuesta de la RPC
    if (!rpcData || !rpcData.success) {
      console.error('RPC returned error:', rpcData?.error);
      return { 
        ok: false, 
        error: rpcData?.error || 'Error al crear el perfil de repartidor.' 
      };
    }

    return { ok: true, userId };

  } catch (error: unknown) {
    console.error('Delivery agent registration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('User already registered')) {
      return { ok: false, error: 'Este correo electrónico ya está registrado.' };
    }
    
    if (errorMessage.includes('duplicate key')) {
      return { ok: false, error: 'Este correo o teléfono ya está registrado.' };
    }

    return { 
      ok: false, 
      error: 'Hubo un error al procesar tu registro. Por favor, intenta de nuevo.' 
    };
  }
}