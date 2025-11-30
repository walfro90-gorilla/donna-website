// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth/service';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Procesando callback de Google...');

        // Supabase maneja automáticamente el callback
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('🔐 AuthCallback: Error en callback:', error);
          router.push('/login?error=oauth_error');
          return;
        }

        if (!session) {
          console.log('🔐 AuthCallback: No session found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('🔐 AuthCallback: Sesión encontrada, obteniendo perfil...');

        // Obtener perfil del usuario
        let user = await AuthService.getCurrentUser(session.user.id);

        if (!user) {
          console.log('🔐 AuthCallback: Usuario no encontrado, creando perfil...');

          // Crear perfil para usuario nuevo de Google
          const createdUser = await AuthService.createGoogleUserProfile(session.user);

          if (!createdUser) {
            console.error('🔐 AuthCallback: No se pudo crear perfil');
            router.push('/login?error=profile_creation_failed');
            return;
          }

          user = createdUser;
        }

        console.log('🔐 AuthCallback: Usuario encontrado, rol:', user.role);

        // Redirigir según el rol
        const redirectPath = AuthService.getRedirectPath(user.role);
        console.log('🔐 AuthCallback: Redirigiendo a:', redirectPath);

        router.push(redirectPath);

      } catch (error) {
        console.error('🔐 AuthCallback: Error inesperado:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#e4007c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completando inicio de sesión con Google...</p>
        <p className="text-sm text-gray-500 mt-2">Por favor espera un momento</p>
      </div>
    </div>
  );
}