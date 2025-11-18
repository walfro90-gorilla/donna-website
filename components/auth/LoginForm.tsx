// components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { AuthService } from '@/lib/auth/service';

interface FormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

export default function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    isLoading: false,
    error: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.email || !formState.password) {
      setFormState(prev => ({
        ...prev,
        error: 'Por favor completa todos los campos',
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await signIn({
        email: formState.email,
        password: formState.password,
      });

      if (result.success && result.user) {
        const redirectPath = AuthService.getRedirectPath(result.user.role);
        console.log('🔐 LoginForm: Redirigiendo a:', redirectPath);
        router.push(redirectPath);
      } else {
        setFormState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Error de autenticación',
        }));
      }
    } catch (error) {
      console.error('🔐 LoginForm: Error inesperado:', error);
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error inesperado. Intenta de nuevo.',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {formState.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {formState.error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
                value={formState.email}
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                disabled={formState.isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] focus:z-10 sm:text-sm"
                placeholder="••••••••"
                value={formState.password}
                onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                disabled={formState.isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={formState.isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#e4007c] hover:bg-[#c0006a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formState.isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}