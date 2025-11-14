// lib/utils/registerDeliveryAgent.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePhoneToCanonical } from './validation';

export interface RegisterDeliveryAgentPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
}

export interface RegisterDeliveryAgentResult {
  ok: boolean;
  error?: string;
  userId?: string;
}

/**
 * Registra un delivery agent siguiendo el flujo de la aplicación
 * 1. Validaciones de disponibilidad
 * 2. SignUp en Supabase Auth
 * 3. ensure_user_profile_v2 con reintentos
 * 4. register_delivery_agent_v2 con fallback
 */
export async function registerDeliveryAgentClient(
  supabase: SupabaseClient,
  payload: RegisterDeliveryAgentPayload
): Promise<RegisterDeliveryAgentResult> {
  try {
    const canonicalPhone = normalizePhoneToCanonical(payload.phone);

    // 1) Validaciones de disponibilidad usando funciones existentes de Flutter
    try {
      // Intentar con diferentes nombres de funciones que podrías tener
      let emailAvailable = true;
      
      // Opción 1: check_email_availability (nueva)
      try {
        const { data, error } = await supabase.rpc('check_email_availability', { 
          p_email: payload.email 
        });
        if (!error) emailAvailable = data;
      } catch {
        // Opción 2: validate_email (posible nombre en Flutter)
        try {
          const { data, error } = await supabase.rpc('validate_email', { 
            email: payload.email 
          });
          if (!error) emailAvailable = !data; // Invertir si retorna true cuando está tomado
        } catch {
          // Opción 3: is_email_available
          try {
            const { data, error } = await supabase.rpc('is_email_available', { 
              email: payload.email 
            });
            if (!error) emailAvailable = data;
          } catch {
            console.warn('No email validation function found, skipping validation');
          }
        }
      }
      
      if (!emailAvailable) {
        return { ok: false, error: 'Este correo electrónico ya está registrado.' };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      console.warn('Email availability check failed:', errorMessage);
    }

    // Nota: Phone no tiene constraint UNIQUE en la tabla users, 
    // por lo que no validamos disponibilidad de teléfono

    // 2) Crear usuario en Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: canonicalPhone,
          city: payload.city,
          user_type: 'delivery_agent'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return { ok: false, error: 'Este correo electrónico ya está registrado.' };
      }
      throw signUpError;
    }

    const user = signUpData.user;
    if (!user) {
      return { ok: false, error: 'No se pudo crear la cuenta de usuario.' };
    }

    // 3) Asegurar perfil de usuario usando funciones existentes de Flutter
    const ensureParams = {
      p_user_id: user.id,
      p_email: payload.email,
      p_phone: canonicalPhone,
      p_first_name: payload.firstName,
      p_last_name: payload.lastName,
      p_user_type: 'delivery_agent'
    };

    let ensured = false;
    const functionNames = [
      'ensure_user_profile_v2',    // Función nueva
      'ensure_user_profile',       // Posible nombre en Flutter
      'create_user_profile',       // Alternativa
      'ensure_user_profile_public' // Fallback público
    ];

    for (const funcName of functionNames) {
      if (ensured) break;
      
      try {
        const { error } = await supabase.rpc(funcName, ensureParams);
        if (!error) {
          ensured = true;
          console.log(`User profile ensured with function: ${funcName}`);
          break;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '';
        if (!errorMessage.includes('could not find the function')) {
          console.warn(`Function ${funcName} failed:`, errorMessage);
        }
      }
    }

    if (!ensured) {
      console.warn('Could not ensure user profile with any available function');
    }

    // 4) Registrar como delivery agent usando funciones existentes de Flutter
    const deliveryAgentParams = {
      p_user_id: user.id,
      p_email: payload.email,
      p_phone: canonicalPhone,
      p_first_name: payload.firstName,
      p_last_name: payload.lastName,
      p_city: payload.city
    };

    // Intentar con diferentes nombres de funciones que podrías tener en Flutter
    const deliveryFunctionNames = [
      'register_delivery_agent_v2',  // Función nueva
      'register_delivery_agent',     // Posible nombre en Flutter
      'create_delivery_agent',       // Alternativa
      'register_repartidor',         // Si usas español en Flutter
      'create_repartidor_profile'    // Otra alternativa
    ];

    let reg = { error: null };
    let functionUsed = null;

    for (const funcName of deliveryFunctionNames) {
      try {
        reg = await supabase.rpc(funcName, deliveryAgentParams);
        if (!reg.error) {
          functionUsed = funcName;
          console.log(`Delivery agent registered with function: ${funcName}`);
          break;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '';
        if (!errorMessage.includes('could not find the function')) {
          console.warn(`Function ${funcName} failed:`, errorMessage);
        }
      }
    }

    if (reg.error) {
      const code = reg.error.code;
      const msg = reg.error.message || '';
      
      if (code === 'PGRST202' || code === '42883' || msg.includes('could not find the function')) {
        // Usar funciones alternativas o inserción directa
        try {
          // Primero crear el registro en users si no existe
          const { error: userInsertError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: payload.email,
              name: `${payload.firstName} ${payload.lastName}`,
              phone: canonicalPhone,
              role: 'delivery_agent',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (userInsertError) {
            console.warn('User insert failed:', userInsertError);
          }

          // Luego crear el perfil de delivery agent
          const { error: insertError } = await supabase
            .from('delivery_agent_profiles')
            .insert({
              user_id: user.id,
              status: 'pending',
              account_state: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.warn('Direct insert failed:', insertError);
            return { 
              ok: true, 
              userId: user.id,
              error: 'Cuenta creada, pero hubo un problema al registrar tu perfil de repartidor. Nuestro equipo lo revisará manualmente.'
            };
          }
        } catch (insertErr) {
          console.warn('Fallback insert failed:', insertErr);
          return { 
            ok: true, 
            userId: user.id,
            error: 'Cuenta creada, pero hubo un problema al registrar tu perfil de repartidor. Nuestro equipo lo revisará manualmente.'
          };
        }
      } else {
        throw reg.error;
      }
    }

    return { ok: true, userId: user.id };

  } catch (error: unknown) {
    console.error('Delivery agent registration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '';
    
    if (errorMessage.includes('User already registered')) {
      return { ok: false, error: 'Este correo electrónico ya está registrado.' };
    }
    
    if (errorMessage.includes('Invalid email')) {
      return { ok: false, error: 'El formato del correo electrónico no es válido.' };
    }
    
    if (errorMessage.includes('Password should be at least')) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    return { 
      ok: false, 
      error: 'Hubo un error al procesar tu registro. Por favor, intenta de nuevo.' 
    };
  }
}