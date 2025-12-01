// lib/supabase/auth.ts
import { createClient } from './client';
import { AuthResult, UserRole } from '@/types/auth';
import { Session } from '@supabase/supabase-js';

/**
 * Sign in with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns AuthResult with user data and role on success, or error message on failure
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    console.log('🔑 signInWithEmail: Iniciando autenticación...');
    console.log('🔑 signInWithEmail: Email:', email);

    const supabase = createClient();

    // Authenticate with Supabase - sin timeout para ver si funciona
    console.log('🔑 signInWithEmail: Llamando a signInWithPassword...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('🔑 signInWithEmail: Respuesta recibida');

    console.log('🔑 signInWithEmail: Respuesta de Supabase:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message
    });

    if (error) {
      console.error('🔑 signInWithEmail: Error de autenticación:', error.message);
      // Map Supabase error codes to user-friendly Spanish messages
      let errorMessage = 'Email o contraseña incorrectos';

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'No existe una cuenta con este email';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Por favor intenta más tarde';
      } else if (error.status === 400) {
        errorMessage = 'Email o contraseña incorrectos';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No se pudo obtener la información del usuario',
      };
    }

    // Fetch user role from database
    console.log('🔑 signInWithEmail: Obteniendo rol del usuario...');
    console.log('🔑 signInWithEmail: User ID:', data.user.id);

    try {
      const role = await getUserRole(data.user.id);
      console.log('🔑 signInWithEmail: Rol obtenido:', role);

      if (!role) {
        console.error('🔑 signInWithEmail: Usuario sin rol en la base de datos');
        return {
          success: false,
          error: 'Usuario no encontrado en la base de datos. Contacta al administrador.',
        };
      }

      const authRole = mapDatabaseRoleToAuthRole(role);
      console.log('🔑 signInWithEmail: Rol mapeado:', authRole);

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
        },
        role: authRole,
      };
    } catch (roleError) {
      console.error('🔑 signInWithEmail: Error obteniendo rol:', roleError);
      return {
        success: false,
        error: 'Error al obtener información del usuario. Intenta de nuevo.',
      };
    }
  } catch (error) {
    // Network or unexpected errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Error de conexión. Por favor, verifica tu internet',
      };
    }

    return {
      success: false,
      error: 'Ocurrió un error inesperado. Intenta nuevamente',
    };
  }
}

/**
 * Sign in with Google OAuth
 * @returns AuthResult indicating success or failure
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const supabase = createClient();

    // Initiate Google OAuth flow
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      // Map OAuth errors to user-friendly Spanish messages
      let errorMessage = 'Error al iniciar sesión con Google';

      if (error.message.includes('popup')) {
        errorMessage = 'Por favor permite las ventanas emergentes para continuar';
      } else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
        errorMessage = 'Inicio de sesión con Google cancelado';
      } else if (error.message.includes('network')) {
        errorMessage = 'Error de conexión. Por favor, verifica tu internet';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // OAuth flow initiated successfully
    // The actual authentication will complete after redirect
    return {
      success: true,
    };
  } catch (error) {
    // Network or unexpected errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Error de conexión. Por favor, verifica tu internet',
      };
    }

    return {
      success: false,
      error: 'Ocurrió un error inesperado. Intenta nuevamente',
    };
  }
}

/**
 * Get user role from database
 * @param userId - User's ID
 * @returns UserRole or null if not found
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    console.log('👤 getUserRole: Consultando rol para user ID:', userId);
    const supabase = createClient();

    // Query sin timeout primero para ver el error real
    console.log('👤 getUserRole: Ejecutando query...');
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    console.log('👤 getUserRole: Query completado');

    if (error) {
      console.error('👤 getUserRole: Database error:', error);
      console.error('👤 getUserRole: Error code:', error.code);
      console.error('👤 getUserRole: Error details:', error.details);
      console.error('👤 getUserRole: Error hint:', error.hint);
      return null;
    }

    if (!data) {
      console.error('👤 getUserRole: No data returned');
      return null;
    }

    console.log('👤 getUserRole: Rol encontrado:', data.role);
    return data.role;
  } catch (error) {
    console.error('👤 getUserRole: Error general:', error);
    return null;
  }
}

/**
 * Get redirect path based on user role
 * @param role - User's role
 * @returns Path to redirect to
 */
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'restaurant':
      return '/socios/dashboard';
    case 'admin':
      return '/admin';
    case 'client':
      return '/clientes/dashboard';
    case 'delivery':
      return '/repartidores/dashboard';
    default:
      return '/';
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get current session
 * @returns Session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
}

/**
 * Map database role to auth role type
 * Database uses: 'client', 'restaurant', 'delivery_agent', 'admin'
 * Auth types use: 'client', 'restaurant', 'delivery', 'admin'
 */
function mapDatabaseRoleToAuthRole(dbRole: string): UserRole {
  switch (dbRole) {
    case 'delivery_agent':
      return 'delivery';
    case 'client':
      return 'client';
    case 'restaurant':
      return 'restaurant';
    case 'admin':
      return 'admin';
    default:
      return 'client'; // Default fallback
  }
}
