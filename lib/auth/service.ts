import { supabase } from '@/lib/supabase/client';
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
   * Iniciar sesión con Google OAuth
   */
  static async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 AuthService: Iniciando Google OAuth...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('🔐 AuthService: Error en Google OAuth:', error.message);
        return {
          success: false,
          error: this.mapOAuthError(error.message),
        };
      }

      // OAuth flow initiated successfully
      // The actual authentication will complete after redirect
      console.log('🔐 AuthService: Google OAuth iniciado correctamente');
      return {
        success: true,
      };
    } catch (error) {
      console.error('🔐 AuthService: Error inesperado en Google OAuth:', error);
      return {
        success: false,
        error: 'Error iniciando Google OAuth. Intenta de nuevo.',
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
  static async getCurrentUser(userId?: string): Promise<User | null> {
    try {
      console.log('🔐 AuthService: Obteniendo usuario actual...', userId ? `(ID proporcionado: ${userId})` : '(Sin ID)');

      if (userId) {
        console.log('🔐 AuthService: Usando ID proporcionado, saltando getSession...');
        return this.getUserProfile(userId);
      }

      console.log('🔐 AuthService: Consultando sesión en Supabase...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('🔐 AuthService: Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        sessionError: sessionError?.message
      });

      if (sessionError) {
        console.error('🔐 AuthService: Error obteniendo sesión:', sessionError);
        return null;
      }

      if (!session?.user) {
        console.log('🔐 AuthService: No hay sesión activa');
        return null;
      }

      console.log('🔐 AuthService: Sesión encontrada, obteniendo perfil...');
      const profile = await this.getUserProfile(session.user.id);

      console.log('🔐 AuthService: Perfil obtenido:', {
        exists: !!profile,
        id: profile?.id,
        email: profile?.email,
        role: profile?.role
      });

      return profile;
    } catch (error) {
      console.error('❌ AuthService: Error obteniendo usuario actual:', error);
      return null;
    }
  }

  /**
   * Crear perfil para usuario de Google
   */
  static async createGoogleUserProfile(authUser: any): Promise<User | null> {
    try {
      console.log('👤 AuthService: Creando perfil para usuario de Google:', authUser.id);

      const userData = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'Usuario',
        role: 'client' as UserRole, // Rol por defecto
        phone: authUser.user_metadata?.phone || null,
        email_confirm: true, // Google users are pre-verified
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('👤 AuthService: Error creando perfil:', error);
        return null;
      }

      console.log('👤 AuthService: Perfil creado exitosamente para:', data.email);

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        phone: data.phone,
        email_confirm: data.email_confirm,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error('👤 AuthService: Error inesperado creando perfil:', error);
      return null;
    }
  }

  /**
   * Obtener perfil usando función de base de datos
   */
  private static async getUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('👤 AuthService: Obteniendo perfil para:', userId);

      // Intentar primero con RPC (más seguro/rápido si está configurado)
      const { data, error } = await supabase.rpc('get_user_profile', {
        user_uuid: userId
      });

      if (!error && data && data.length > 0) {
        const profile = data[0];
        console.log('👤 AuthService: Perfil obtenido vía RPC:', profile.role);
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as UserRole,
          phone: profile.phone,
          email_confirm: profile.email_confirm,
          created_at: profile.created_at,
        };
      }

      if (error) {
        console.warn('👤 AuthService: Error en RPC, intentando fallback directo:', error.message);
      } else {
        console.warn('👤 AuthService: RPC no devolvió datos, intentando fallback directo');
      }

      // Fallback: Consulta directa a la tabla users
      const { data: directData, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (directError) {
        console.error('👤 AuthService: Error en fallback directo:', directError);
        return null;
      }

      if (!directData) {
        console.error('👤 AuthService: Usuario no encontrado en tabla users');
        return null;
      }

      console.log('👤 AuthService: Perfil obtenido vía fallback:', directData.role);

      return {
        id: directData.id,
        email: directData.email,
        name: directData.name,
        role: directData.role as UserRole,
        phone: directData.phone,
        email_confirm: directData.email_confirm,
        created_at: directData.created_at,
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
    console.log('🔄 AuthService: Obteniendo ruta de redirección para rol:', role);

    const routes: Record<string, string> = {
      admin: '/admin',
      restaurant: '/restaurant/dashboard',
      client: '/client/dashboard',
      delivery_agent: '/delivery_agent/dashboard',
    };

    const redirectPath = routes[role] || '/';
    console.log('🔄 AuthService: Ruta de redirección:', redirectPath);

    return redirectPath;
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

  /**
   * Mapear errores de OAuth a mensajes en español
   */
  private static mapOAuthError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'popup_closed_by_user': 'Inicio de sesión cancelado',
      'access_denied': 'Acceso denegado por Google',
      'popup_blocked': 'Por favor permite las ventanas emergentes',
      'network_error': 'Error de conexión. Verifica tu internet',
    };

    return errorMap[errorMessage] || 'Error con Google. Intenta de nuevo.';
  }
}