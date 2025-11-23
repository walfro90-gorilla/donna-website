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

  // Ref para mantener el estado actual accesible dentro de closures (event listeners)
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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

      // Usar la referencia actual del estado para evitar closures obsoletos
      const currentUser = stateRef.current.user;

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
        if (!currentUser || currentUser.id !== session.user.id) {
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

  // Monitor de inactividad (5 minutos)
  useEffect(() => {
    if (!state.user) return;

    console.log('⏱️ AuthContext: Iniciando monitor de inactividad (5 min)');

    const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutos
    let timeoutId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const doSignOut = () => {
      console.log('💤 AuthContext: Usuario inactivo por 5 minutos, cerrando sesión...');
      signOut();
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(doSignOut, TIMEOUT_DURATION);
    };

    const onActivity = () => {
      const now = Date.now();
      // Solo reiniciar el timer si ha pasado más de 1 segundo desde la última actividad
      // Esto evita sobrecarga por eventos frecuentes como mousemove
      if (now - lastActivity > 1000) {
        resetTimer();
        lastActivity = now;
      }
    };

    // Eventos a monitorear
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    // Iniciar timer
    resetTimer();

    // Agregar listeners
    events.forEach(event => {
      window.addEventListener(event, onActivity);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, onActivity);
      });
    };
  }, [state.user, signOut]);

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