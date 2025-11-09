// lib/utils/registerRestaurant.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Address } from '@/types/address';
import { normalizePhoneToCanonical } from './validation';

export interface RegisterRestaurantPayload {
  owner_name: string;
  email: string;
  phone: string;
  password: string;
  restaurant_name: string;
  address: string;
  location_lat: number;
  location_lon: number;
  location_place_id?: string | null;
  address_structured?: any | null;
}

export interface RegisterRestaurantResult {
  ok: boolean;
  userId?: string;
  error?: string;
}

/**
 * Registra un restaurante siguiendo el flujo exacto de la app Flutter
 * 1. Validaciones de disponibilidad (opcional)
 * 2. SignUp en Supabase Auth
 * 3. ensure_user_profile_v2 con reintentos
 * 4. register_restaurant_v2 con fallback
 */
export async function registerRestaurantClient(
  supabase: SupabaseClient,
  payload: RegisterRestaurantPayload
): Promise<RegisterRestaurantResult> {
  try {
    // Normalizar teléfono a formato canónico
    const canonicalPhone = normalizePhoneToCanonical(payload.phone);

    // 1) Validaciones de disponibilidad (opcional pero recomendado para UX)
    try {
      const { data: emailAvailable, error: emailError } = await supabase.rpc('check_email_availability', { p_email: payload.email });
      if (!emailError && emailAvailable === false) {
        return { ok: false, error: 'Este correo electrónico ya está registrado.' };
      }
    } catch (e: any) {
      // Si la función no existe, continuar
      const code = `${e?.code || ''}`;
      const msg = `${e?.message || ''}`.toLowerCase();
      if (code !== 'PGRST202' && code !== '42883' && !msg.includes('could not find the function')) {
        console.warn('check_email_availability error:', e);
      }
    }

    try {
      const { data: phoneAvailable, error: phoneError } = await supabase.rpc('check_phone_availability', { p_phone: canonicalPhone });
      if (!phoneError && phoneAvailable === false) {
        return { ok: false, error: 'Este teléfono ya está registrado.' };
      }
    } catch (e: any) {
      // Si la función no existe, continuar
      const code = `${e?.code || ''}`;
      const msg = `${e?.message || ''}`.toLowerCase();
      if (code !== 'PGRST202' && code !== '42883' && !msg.includes('could not find the function')) {
        console.warn('check_phone_availability error:', e);
      }
    }

    try {
      const { data: nameAvailable, error: nameError } = await supabase.rpc('check_restaurant_name_availability', { p_name: payload.restaurant_name });
      if (!nameError && nameAvailable === false) {
        return { ok: false, error: 'Este nombre de restaurante ya está en uso.' };
      }
    } catch (e: any) {
      // Intentar alternativo
      const msg = `${e?.message || ''}`.toLowerCase();
      const code = `${e?.code || ''}`;
      if (code === 'PGRST202' || code === '42883' || msg.includes('could not find the function')) {
        try {
          const { data: nameAvailableAlt, error: nameErrorAlt } = await supabase.rpc('check_restaurant_name_available', { p_name: payload.restaurant_name });
          if (!nameErrorAlt && nameAvailableAlt === false) {
            return { ok: false, error: 'Este nombre de restaurante ya está en uso.' };
          }
        } catch {
          // Si tampoco existe, continuar
        }
      }
    }

    // 2) Crear usuario en Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.owner_name,
          phone: canonicalPhone,
          address: payload.address,
          role: 'restaurant',
          lat: payload.location_lat,
          lon: payload.location_lon,
          address_structured: payload.address_structured ?? null,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return { ok: false, error: 'Este correo electrónico ya está registrado.' };
      }
      return { ok: false, error: signUpError.message };
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      return { ok: false, error: 'No se pudo crear el usuario. No se recibió user.id.' };
    }

    // 3) Asegurar perfil de usuario (idempotente) con reintentos
    const ensureParams = {
      p_user_id: userId,
      p_email: payload.email,
      p_name: payload.owner_name,
      p_role: 'restaurant',
      p_phone: canonicalPhone,
      p_address: payload.address,
      p_lat: payload.location_lat,
      p_lon: payload.location_lon,
      p_address_structured: payload.address_structured ?? null,
    };

    let ensured = false;
    for (let attempt = 1; attempt <= 10 && !ensured; attempt++) {
      try {
        const { error } = await supabase.rpc('ensure_user_profile_v2', ensureParams);
        if (error) throw error;
        ensured = true;
      } catch (e: any) {
        const msg = `${e?.message || ''}`.toLowerCase();
        const code = `${e?.code || ''}`;

        // Intentar fallback si la función no existe
        if (code === 'PGRST202' || code === '42883' || msg.includes('could not find the function')) {
          try {
            const { error: fallbackError } = await supabase.rpc('ensure_user_profile_public', ensureParams);
            if (!fallbackError) {
              ensured = true;
              break;
            }
          } catch {
            // Continuar con el siguiente intento
          }
        }

        // Si el error es "does not exist in auth.users", reintentar
        if (msg.includes('does not exist in auth.users') && attempt < 10) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        // Si es otro error, seguir el flujo y permitir fallback más adelante
        break;
      }
    }

    // 4) Registro atómico del restaurante (y cuenta financiera)
    const regParams = {
      p_user_id: userId,
      p_email: payload.email,
      p_restaurant_name: payload.restaurant_name,
      p_phone: canonicalPhone,
      p_address: payload.address,
      p_location_lat: payload.location_lat,
      p_location_lon: payload.location_lon,
      p_location_place_id: payload.location_place_id ?? null,
      p_address_structured: payload.address_structured ?? null,
    };

    let reg = await supabase.rpc('register_restaurant_v2', regParams);

    if (reg.error) {
      const errMsg = `${reg.error.message || ''}`.toLowerCase();

      // Si el error es de foreign key (usuario no existe en profiles), reintentar ensure + register
      if (errMsg.includes('restaurants_user_id_fkey') || errMsg.includes('foreign key')) {
        await new Promise((r) => setTimeout(r, 350));
        try {
          await supabase.rpc('ensure_user_profile_v2', ensureParams);
        } catch {
          // Intentar fallback
          try {
            await supabase.rpc('ensure_user_profile_public', ensureParams);
          } catch {
            // Continuar
          }
        }
        reg = await supabase.rpc('register_restaurant_v2', regParams);
      }
    }

    if (reg.error) {
      // Fallback si la orquestadora no existe
      const code = reg.error.code;
      const msg = `${reg.error.message || ''}`.toLowerCase();

      if (code === 'PGRST202' || code === '42883' || msg.includes('could not find the function')) {
        // Usar funciones alternativas
        const r1 = await supabase.rpc('create_restaurant_public', {
          p_user_id: userId,
          p_name: payload.restaurant_name,
          p_status: 'pending',
          p_location_lat: payload.location_lat,
          p_location_lon: payload.location_lon,
          p_location_place_id: payload.location_place_id ?? null,
          p_address: payload.address,
          p_address_structured: payload.address_structured ?? null,
          p_phone: canonicalPhone,
          p_online: false,
        });

        if (r1.error) {
          return { ok: false, error: r1.error.message };
        }

        // Crear cuenta financiera (best-effort)
        await supabase.rpc('create_account_public', {
          p_user_id: userId,
          p_account_type: 'restaurant',
          p_balance: 0.0,
        }).catch(() => {
          // Ignorar errores en la creación de cuenta
          console.warn('No se pudo crear la cuenta financiera');
        });
      } else {
        return { ok: false, error: reg.error.message };
      }
    }

    return { ok: true, userId };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || 'Error desconocido al registrar el restaurante',
    };
  }
}

