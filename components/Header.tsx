// components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signOut, getRedirectPath } from "@/lib/supabase/auth";

interface UserData {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const closeMenu = () => setIsMenuOpen(false);
  const closeUserMenu = () => setIsUserMenuOpen(false);

  // Check for user session
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData && mounted) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (userData) {
          setUser(userData);
        }
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      closeUserMenu();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToDashboard = () => {
    if (user?.role) {
      const roleMap: Record<string, 'admin' | 'restaurant' | 'client' | 'delivery'> = {
        'admin': 'admin',
        'restaurant': 'restaurant',
        'client': 'client',
        'delivery_agent': 'delivery',
      };
      const authRole = roleMap[user.role];
      const dashboardPath = getRedirectPath(authRole);
      router.push(dashboardPath);
      closeUserMenu();
    }
  };

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getRoleLabel = () => {
    const roleLabels: Record<string, string> = {
      'admin': 'Administrador',
      'restaurant': 'Restaurante',
      'client': 'Cliente',
      'delivery_agent': 'Repartidor',
    };
    return roleLabels[user?.role || ''] || 'Usuario';
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-shadow duration-200" role="banner">
      <div className="container mx-auto px-4 sm:px-6 h-16 lg:h-[72px] flex justify-between items-center">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 rounded-lg px-2 py-1" 
          onClick={closeMenu} 
          aria-label="Doña Repartos - Ir a la página de inicio"
        >
          <Image
            src="/app_icon.png"
            alt=""
            width={40}
            height={40}
            className="rounded-full object-cover"
            style={{ borderRadius: 'var(--radius-full)' }}
            priority
            aria-hidden="true"
          />
          <span className="text-lg sm:text-xl font-bold text-gray-800 hidden sm:block">
            Doña Repartos
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6" aria-label="Navegación principal" role="navigation">
          <Link
            href="/clientes"
            className="text-gray-600 hover:text-[#e4007c] transition-all duration-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 rounded px-3 py-2"
          >
            Para Clientes
          </Link>
          <Link
            href="/socios"
            className="text-gray-600 hover:text-[#e4007c] transition-all duration-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 rounded px-3 py-2"
          >
            Para Restaurantes
          </Link>
          <Link
            href="/registro-repartidor"
            className="text-gray-600 hover:text-[#e4007c] transition-all duration-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 rounded px-3 py-2"
          >
            Para Repartidores
          </Link>
        </nav>

        {/* Right side - Auth section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {user ? (
            /* User Avatar Menu - Desktop */
            <div className="hidden lg:block relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 rounded-lg p-1 hover:bg-gray-50 transition-colors"
                aria-label="Menú de usuario"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-10 h-10 rounded-full bg-[#e4007c] flex items-center justify-center text-white font-semibold shadow-sm">
                  {getUserInitial()}
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={closeUserMenu}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{getRoleLabel()}</p>
                    </div>
                    <button
                      onClick={handleGoToDashboard}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Mi Dashboard</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Login Button - Only when NOT logged in */
            <Link 
              href="/login"
              className="hidden lg:flex items-center text-[#e4007c] hover:text-white hover:bg-[#e4007c] px-4 py-2 text-sm font-medium border border-[#e4007c] rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2"
              style={{ minHeight: '44px' }}
              aria-label="Iniciar sesión"
            >
              Entrar
            </Link>
          )}
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 rounded p-2"
            style={{ minWidth: '48px', minHeight: '48px' }}
            aria-label={isMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div id="mobile-menu" className="lg:hidden bg-white border-t border-gray-200 py-4 animate-slide-down">
          <nav className="flex flex-col items-stretch px-4 space-y-2" aria-label="Navegación móvil" role="navigation">
            <Link
              href="/clientes"
              className="text-gray-600 hover:text-[#e4007c] hover:bg-[#fef2f9] transition-all duration-200 font-medium py-3 px-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 min-h-[48px] flex items-center"
              onClick={closeMenu}
            >
              Para Clientes
            </Link>
            <Link
              href="/socios"
              className="text-gray-600 hover:text-[#e4007c] hover:bg-[#fef2f9] transition-all duration-200 font-medium py-3 px-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 min-h-[48px] flex items-center"
              onClick={closeMenu}
            >
              Para Restaurantes
            </Link>
            <Link
              href="/registro-repartidor"
              className="text-gray-600 hover:text-[#e4007c] hover:bg-[#fef2f9] transition-all duration-200 font-medium py-3 px-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 min-h-[48px] flex items-center"
              onClick={closeMenu}
            >
              Para Repartidores
            </Link>
            
            {/* Auth section for mobile */}
            <div className="flex flex-col px-4 pb-2 border-t border-gray-200 mt-2 pt-4 space-y-3">
              {user ? (
                /* User info and actions - Mobile */
                <>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-[#fef2f9] to-white rounded-lg border border-pink-100">
                    <div className="w-12 h-12 rounded-full bg-[#e4007c] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                      {getUserInitial()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleGoToDashboard();
                      closeMenu();
                    }}
                    className="text-gray-700 hover:text-[#e4007c] hover:bg-[#fef2f9] px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 flex items-center space-x-2 border border-gray-200"
                    style={{ minHeight: '48px' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Mi Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMenu();
                    }}
                    className="text-gray-700 hover:text-red-600 hover:bg-red-50 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 flex items-center space-x-2 border border-gray-200"
                    style={{ minHeight: '48px' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                /* Login button - Only when NOT logged in */
                <Link 
                  href="/login"
                  className="text-[#e4007c] hover:text-white hover:bg-[#e4007c] px-4 py-3 text-sm font-medium border border-[#e4007c] rounded-lg transition-all duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2"
                  style={{ minHeight: '48px' }}
                  onClick={closeMenu}
                  aria-label="Iniciar sesión"
                >
                  Entrar
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
