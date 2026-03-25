// lib/auth/context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

  // Refs para acceder al estado actual dentro de closures
  const stateRef = useRef(state);
  const loadingUserRef = useRef(false);
  const manualSignInRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async (event: string, session: any) => {
      if (!mounted) return;

      const currentUser = stateRef.current.user;

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          if (!loadingUserRef.current) {
            loadingUserRef.current = true;
            await loadUser(session.user.id);
            loadingUserRef.current = false;
          }
        } else {
          setState({ user: null, loading: false, error: null });
        }
        setIsInitialized(true);

      } else if (event === 'SIGNED_IN' && session?.user) {
        // Evitar fetch duplicado: login manual ya cargó el perfil
        if (manualSignInRef.current) return;
        if (currentUser?.id === session.user.id) return;
        if (loadingUserRef.current) return;

        loadingUserRef.current = true;
        await loadUser(session.user.id);
        loadingUserRef.current = false;

      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, loading: false, error: null });

      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // No refetchar perfil si ya tenemos el mismo usuario
        if (currentUser?.id === session.user.id) return;
        if (loadingUserRef.current) return;

        loadingUserRef.current = true;
        await loadUser(session.user.id);
        loadingUserRef.current = false;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);



  const loadUser = async (userId?: string) => {
    try {
      console.log('🔐 AuthContext: Cargando usuario...', userId ? `ID: ${userId}` : '');

      // Verificar si ya tenemos el usuario correcto (usando el estado actual del componente)
      // Nota: Dentro de loadUser, 'state' es el del render actual, así que está bien.
      // Pero para mayor seguridad si se llama desde un closure, podríamos usar stateRef si lo pasáramos,
      // pero loadUser se recrea en cada render? No, es una función definida en el cuerpo.
      // Espera, loadUser usa 'state' del closure del render.
      // Si loadUser se llama desde handleAuthChange (que es un closure antiguo),
      // loadUser TAMBIÉN es el closure antiguo.
      // ASÍ QUE loadUser TAMBIÉN TIENE EL ESTADO OBSOLETO.

      // FIX: Usar stateRef dentro de loadUser también si es posible, o confiar en que la verificación
      // se hizo antes de llamar.
      // Sin embargo, setState usa functional update o reemplazo completo.

      // Vamos a confiar en la verificación hecha en handleAuthChange.
      // Pero aquí también podemos verificar contra stateRef por seguridad.

      /* 
         IMPORTANTE: loadUser se define en cada render, pero el handleAuthChange usa la versión
         del PRIMER render (por el useEffect []).
         Por lo tanto, este 'loadUser' es la versión del primer render.
         Y 'state' aquí es el estado inicial.
      */

      const user = await AuthService.getCurrentUser(userId);

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

    const withTimeout = <T,>(promise: Promise<T>, ms = 10000): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), ms)
        ),
      ]);

    manualSignInRef.current = true;

    try {
      // Paso 1: Autenticar credenciales
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
      );

      if (error) {
        const errorMsg = AuthService.mapAuthError(error.message);
        setState(prev => ({ ...prev, loading: false, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      if (!data.user) {
        setState(prev => ({ ...prev, loading: false, error: 'No se pudo obtener la sesión' }));
        return { success: false, error: 'No se pudo obtener la sesión' };
      }

      // Paso 2: Obtener perfil del usuario (con timeout propio)
      const user = await withTimeout(AuthService.getCurrentUser(data.user.id));

      if (!user) {
        setState(prev => ({ ...prev, loading: false, error: 'Usuario no encontrado en la base de datos' }));
        return { success: false, error: 'Usuario no encontrado en la base de datos' };
      }

      setState({ user, loading: false, error: null });
      manualSignInRef.current = false;
      return { success: true, user };

    } catch (err: any) {
      manualSignInRef.current = false;
      const errorMsg = err?.message === 'TIMEOUT'
        ? 'La conexión tardó demasiado. Verifica tu internet e intenta de nuevo.'
        : 'Error de conexión. Intenta de nuevo.';
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
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

  const signOut = useCallback(async () => {
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
  }, []);

  const refreshUser = async () => {
    // Aquí loadUser usará el state del render actual, así que está bien.
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