// lib/auth/context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AuthService } from './service';
import { AuthContextType, AuthState, LoginCredentials, AuthResult } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let loadingUser = false;

    console.log('🔐 AuthContext: Inicializando AuthProvider...');

    // Función para manejar cambios de auth
    const handleAuthChange = async (event: string, session: any) => {
      if (!mounted) {
        console.log('🔐 AuthContext: Componente desmontado, ignorando evento:', event);
        return;
      }

      console.log('🔐 AuthContext: Auth state changed:', event);
      console.log('🔐 AuthContext: Session exists:', !!session);
      console.log('🔐 AuthContext: User ID:', session?.user?.id || 'null');
      console.log('🔐 AuthContext: Loading user:', loadingUser);
      console.log('🔐 AuthContext: Is initialized:', isInitialized);

      // Evitar cargas múltiples
      if (loadingUser) {
        console.log('🔐 AuthContext: Ya cargando usuario, ignorando evento');
        return;
      }

      if (event === 'INITIAL_SESSION') {
        console.log('🔐 AuthContext: Procesando sesión inicial...');
        if (session?.user) {
          console.log('🔐 AuthContext: Sesión inicial encontrada, cargando usuario...');
          loadingUser = true;
          await loadUser(session.user.id);
          loadingUser = false;
        } else {
          console.log('🔐 AuthContext: No hay sesión inicial');
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
        setIsInitialized(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 AuthContext: Usuario se logueó, cargando datos...');
        loadingUser = true;
        await loadUser(session.user.id);
        loadingUser = false;
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 AuthContext: Usuario se deslogueó, limpiando estado...');
        setState({
          user: null,
          loading: false,
          error: null,
        });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔐 AuthContext: Token renovado');
        // Solo cargar usuario si no tenemos uno o si el ID cambió
        if (!state.user || state.user.id !== session.user.id) {
          console.log('🔐 AuthContext: Cargando usuario después de refresh token...');
          loadingUser = true;
          await loadUser(session.user.id);
          loadingUser = false;
        } else {
          console.log('🔐 AuthContext: Usuario ya cargado, manteniendo estado');
        }
      }
    };

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      console.log('🔐 AuthContext: Limpiando AuthProvider...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);



  const loadUser = async (userId?: string) => {
    try {
      console.log('🔐 AuthContext: Cargando usuario...', userId ? `ID: ${userId}` : '');

      // Verificar si ya tenemos el usuario correcto
      if (state.user && userId && state.user.id === userId) {
        console.log('🔐 AuthContext: Usuario ya cargado con el mismo ID, manteniendo estado');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const user = await AuthService.getCurrentUser();

      console.log('🔐 AuthContext: Usuario obtenido del servicio:', {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        role: user?.role,
        name: user?.name
      });

      setState({
        user,
        loading: false,
        error: user ? null : 'No se pudo cargar el usuario',
      });

      if (user) {
        console.log('✅ AuthContext: Usuario cargado exitosamente:', user.role);
      } else {
        console.log('❌ AuthContext: No se pudo cargar el usuario');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error cargando usuario:', error);
      setState({
        user: null,
        loading: false,
        error: 'Error cargando usuario',
      });
    }
  };

  const signIn = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const result = await AuthService.signIn(credentials);

    if (result.success && result.user) {
      setState({
        user: result.user,
        loading: false,
        error: null,
      });
    } else {
      setState(prev => ({
        ...prev,
        loading: false,
        error: result.error || 'Error de autenticación',
      }));
    }

    return result;
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const result = await AuthService.signInWithGoogle();

    if (!result.success) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: result.error || 'Error con Google Auth',
      }));
    }
    // Note: For OAuth, the loading state will be cleared by onAuthStateChange
    // when the user returns from Google

    return result;
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await AuthService.signOut();
      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('🔐 AuthContext: Error cerrando sesión:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error cerrando sesión',
      }));
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}