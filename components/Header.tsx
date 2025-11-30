// components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { AuthService } from "@/lib/auth/service";
import { useTheme } from "@/components/ThemeProvider";

const navLinkClasses = "text-gray-600 dark:text-gray-100 hover:text-primary dark:hover:text-primary hover:bg-primary-light/50 dark:hover:bg-primary/10 transition-all duration-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-4 py-2";

export default function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);
  const closeUserMenu = () => setIsUserMenuOpen(false);

  const handleLogout = async () => {
    try {
      await signOut();
      closeUserMenu();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToDashboard = () => {
    if (user?.role) {
      const dashboardPath = AuthService.getRedirectPath(user.role);
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
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 transition-all duration-300 border-b border-transparent dark:border-gray-800 hover:bg-white/95 dark:hover:bg-gray-900/95" role="banner">
      <div className="container mx-auto px-4 sm:px-6 h-16 lg:h-[72px] flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-2 py-1 group"
          onClick={closeMenu}
          aria-label="Doña Repartos - Ir a la página de inicio"
        >
          <div className="relative overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110 shadow-md">
            <Image
              src="/app_icon.png"
              alt=""
              width={40}
              height={40}
              className="object-cover"
              priority
              aria-hidden="true"
            />
          </div>
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hidden sm:block tracking-tight group-hover:text-primary transition-colors">
            Doña Repartos
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1" aria-label="Navegación principal" role="navigation">
          {/* <Link
            href="/clientes"
            className={navLinkClasses}
            prefetch={false}
          >
            Para Clientes
          </Link> */}
          <Link
            href="/socios"
            className={navLinkClasses}
            prefetch={false}
          >
            Para Restaurantes
          </Link>
          <Link
            href="/registro-repartidor"
            className={navLinkClasses}
            prefetch={false}
          >
            Para Repartidores
          </Link>
        </nav>

        {/* Right side - Auth section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Theme Toggle - Desktop */}
          <button
            onClick={toggleTheme}
            className="hidden lg:flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#e4007c]"
            aria-label={theme === 'light' ? "Activar modo oscuro" : "Activar modo claro"}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {user ? (
            /* User Avatar Menu - Desktop */
            <div className="hidden lg:block relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label="Menú de usuario"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-10 h-10 rounded-full bg-[#e4007c] flex items-center justify-center text-white font-semibold shadow-sm">
                  {getUserInitial()}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
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
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-800 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getRoleLabel()}</p>
                    </div>
                    <button
                      onClick={handleGoToDashboard}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Mi Dashboard</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center space-x-2 transition-colors"
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
              className="hidden lg:flex items-center text-white bg-[#e4007c] hover:bg-[#c00068] px-4 py-2 text-sm font-medium border border-transparent rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2"
              style={{ minHeight: '44px' }}
              aria-label="Iniciar sesión"
            >
              Entrar
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-gray-800 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 rounded p-2"
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
        <div id="mobile-menu" className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 animate-slide-down">
          <nav className="flex flex-col items-stretch px-4 space-y-2" aria-label="Navegación móvil" role="navigation">
            {/* <Link
              href="/clientes"
              className="text-gray-600 dark:text-gray-300 hover:text-[#e4007c] dark:hover:text-[#e4007c] hover:bg-[#fef2f9] dark:hover:bg-gray-800 transition-all duration-200 font-medium py-3 px-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 min-h-[48px] flex items-center"
              onClick={closeMenu}
            >
              Para Clientes
            </Link> */}
            <Link
              href="/socios"
              className="text-gray-600 dark:text-gray-300 hover:text-[#e4007c] dark:hover:text-[#e4007c] hover:bg-[#fef2f9] dark:hover:bg-gray-800 transition-all duration-200 font-medium py-3 px-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 min-h-[48px] flex items-center"
              onClick={closeMenu}
            >
              Para Restaurantes
            </Link>
            <Link
              href="/registro-repartidor"
              className="text-gray-600 dark:text-gray-300 hover:text-[#e4007c] dark:hover:text-[#e4007c] hover:bg-[#fef2f9] dark:hover:bg-gray-800 transition-all duration-200 font-medium py-3 px-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 min-h-[48px] flex items-center"
              onClick={closeMenu}
            >
              Para Repartidores
            </Link>

            {/* Auth section for mobile */}
            <div className="flex flex-col px-4 pb-2 border-t border-gray-200 dark:border-gray-800 mt-2 pt-4 space-y-3">
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-[#e4007c] dark:hover:text-[#e4007c] font-medium py-2"
              >
                {theme === 'light' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>Modo Oscuro</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Modo Claro</span>
                  </>
                )}
              </button>

              {user ? (
                /* User info and actions - Mobile */
                <>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-[#fef2f9] to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-pink-100 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-[#e4007c] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                      {getUserInitial()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleGoToDashboard();
                      closeMenu();
                    }}
                    className="text-gray-700 dark:text-gray-300 hover:text-[#e4007c] dark:hover:text-[#e4007c] hover:bg-[#fef2f9] dark:hover:bg-gray-800 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 flex items-center space-x-2 border border-gray-200 dark:border-gray-700"
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
                    className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 flex items-center space-x-2 border border-gray-200 dark:border-gray-700"
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
