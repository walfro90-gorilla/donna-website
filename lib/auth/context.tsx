// lib/auth/context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './client';
import { AuthService } from './service';
import { AuthContextType, AuthState, LoginCredentials, AuthResult } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Obtener sesión inicial
    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setState({
        user,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('🔐 AuthContext: Error inicializando auth:', error);
      setState({
        user: null,
        loading: false,
        error: 'Error inicializando autenticación',
      });
    }
  };

  const loadUser = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const user = await AuthService.getCurrentUser();
      
      setState({
        user,
        loading: false,
        error: user ? null : 'No se pudo cargar el usuario',
      });
    } catch (error) {
      console.error('🔐 AuthContext: Error cargando usuario:', error);
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