// lib/auth/service.ts
import { supabase } from './client';
import { User, LoginCredentials, AuthResult, UserRole } from './types';

export class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService: Iniciando autenticación...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('🔐 AuthService: Error de autenticación:', error.message);
        return {
          success: false,
          error: this.mapAuthError(error.message),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No se pudo obtener información del usuario',
        };
      }

      console.log('🔐 AuthService: Autenticación exitosa, obteniendo perfil...');
      
      // Obtener perfil del usuario usando la función de la base de datos
      const user = await this.getUserProfile(data.user.id);
      
      if (!user) {
        return {
          success: false,
          error: 'Usuario no encontrado en la base de datos',
        };
      }

      console.log('🔐 AuthService: Login completo, rol:', user.role);
      
      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('🔐 AuthService: Error inesperado:', error);
      return {
        success: false,
        error: 'Error de conexión. Intenta de nuevo.',
      };
    }
  }

  /**
   * Cerrar sesión
   */
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  /**
   * Obtener perfil del usuario actual
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      return await this.getUserProfile(session.user.id);
    } catch (error) {
      console.error('🔐 AuthService: Error obteniendo usuario actual:', error);
      return null;
    }
  }

  /**
   * Obtener perfil usando función de base de datos
   */
  private static async getUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('👤 AuthService: Obteniendo perfil para:', userId);
      
      const { data, error } = await supabase.rpc('get_user_profile', {
        user_uuid: userId
      });

      if (error) {
        console.error('👤 AuthService: Error en RPC:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.error('👤 AuthService: Usuario no encontrado');
        return null;
      }

      const profile = data[0];
      console.log('👤 AuthService: Perfil obtenido:', profile.role);
      
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as UserRole,
        phone: profile.phone,
        email_confirm: profile.email_confirm,
        created_at: profile.created_at,
      };
    } catch (error) {
      console.error('👤 AuthService: Error obteniendo perfil:', error);
      return null;
    }
  }

  /**
   * Obtener ruta de redirección según el rol
   */
  static getRedirectPath(role: UserRole): string {
    const routes = {
      admin: '/admin',
      restaurant: '/socios/dashboard',
      client: '/clientes/dashboard',
      delivery_agent: '/repartidores/dashboard',
    };
    
    return routes[role] || '/';
  }

  /**
   * Mapear errores de Supabase a mensajes en español
   */
  private static mapAuthError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Email o contraseña incorrectos',
      'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión',
      'User not found': 'No existe una cuenta con este email',
      'Too many requests': 'Demasiados intentos. Intenta más tarde',
      'Signup not allowed': 'El registro no está permitido',
    };

    return errorMap[errorMessage] || 'Error de autenticación. Intenta de nuevo.';
  }
}