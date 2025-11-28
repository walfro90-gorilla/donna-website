// lib/supabase/rpc-config.ts
// Configuración de funciones RPC para reutilizar las existentes de Flutter

export const RPC_FUNCTIONS = {
  // Funciones de validación
  validation: {
    // Opciones para validar email (en orden de prioridad)
    checkEmailAvailability: [
      'check_email_availability',  // Función nueva
      'validate_email',           // Posible nombre en Flutter
      'is_email_available',       // Alternativa
      'email_exists'              // Otra alternativa
    ],

    // Opciones para validar teléfono (si existe)
    checkPhoneAvailability: [
      'check_phone_availability',
      'validate_phone',
      'is_phone_available',
      'phone_exists'
    ]
  },

  // Funciones de perfil de usuario
  userProfile: {
    ensure: [
      'ensure_user_profile_v2',
      'ensure_user_profile',
      'create_user_profile',
      'ensure_user_profile_public'
    ]
  },

  // Funciones de registro de delivery agent
  deliveryAgent: {
    register: [
      'register_delivery_agent_v2',
      'register_delivery_agent',
      'create_delivery_agent',
      'register_repartidor',
      'create_repartidor_profile'
    ]
  },

  // Funciones de registro de restaurante (para referencia)
  restaurant: {
    register: [
      'register_restaurant_v2',
      'register_restaurant',
      'create_restaurant'
    ]
  },

  // Funciones de registro de cliente (para referencia)
  client: {
    register: [
      'register_client_v2',
      'register_client',
      'create_client'
    ]
  }
};

// Función helper para intentar múltiples nombres de función
export async function tryRpcFunctions(
  supabase: any,
  functionNames: string[],
  params: any
): Promise<{ data: any; error: any; functionUsed?: string }> {
  for (const funcName of functionNames) {
    try {
      const result = await supabase.rpc(funcName, params);
      if (!result.error) {
        return { ...result, functionUsed: funcName };
      }
    } catch (err: any) {
      const errorMessage = err?.message || '';
      if (!errorMessage.includes('could not find the function')) {
        console.warn(`Function ${funcName} failed:`, errorMessage);
      }
    }
  }

  return {
    data: null,
    error: { message: `None of the functions worked: ${functionNames.join(', ')}` }
  };
}

// Configuración específica para tu proyecto
// ACTUALIZA ESTOS NOMBRES CON LOS QUE USAS EN FLUTTER
export const PROJECT_RPC_FUNCTIONS = {
  // Reemplaza con los nombres exactos de tus funciones de Flutter
  emailValidation: 'check_email_availability',  // ← Cambia este nombre
  phoneValidation: 'check_phone_availability',  // ← Validacion de telefono habilitada
  userProfileEnsure: 'ensure_user_profile_v2',  // ← Cambia este nombre
  deliveryAgentRegister: 'register_delivery_agent_v2', // ← Cambia este nombre

  // Parámetros que espera cada función (actualiza según tu Flutter app)
  params: {
    emailValidation: { p_email: 'email' },           // ← Ajusta los nombres de parámetros
    userProfileEnsure: {                             // ← Ajusta los nombres de parámetros
      p_user_id: 'user_id',
      p_email: 'email',
      p_phone: 'phone',
      p_first_name: 'first_name',
      p_last_name: 'last_name',
      p_user_type: 'user_type'
    },
    deliveryAgentRegister: {                         // ← Ajusta los nombres de parámetros
      p_user_id: 'user_id',
      p_email: 'email',
      p_phone: 'phone',
      p_first_name: 'first_name',
      p_last_name: 'last_name',
      p_city: 'city'
    }
  }
};