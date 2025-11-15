// components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-shadow duration-200" role="banner">
      <div className="container mx-auto px-4 sm:px-6 h-16 lg:h-[72px] flex justify-between items-center">
        {/* Logo - Requirements: 14.2, 14.3 */}
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

        {/* Navegación para Escritorio - Requirements: 13.1, 13.3, 14.2, 14.3 */}
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

        {/* Right side with auth buttons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Auth buttons - Requirements: 2.1, 14.2, 14.5 */}
          <button 
            className="hidden lg:block text-[#e4007c] hover:text-[#c6006b] px-4 py-2 text-sm font-medium border border-[#e4007c] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2"
            style={{ minHeight: '44px' }}
            aria-label="Iniciar sesión"
          >
            Entrar
          </button>
          <button 
            className="hidden lg:block bg-[#e4007c] hover:bg-[#c6006b] text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            style={{ minHeight: '44px' }}
            aria-label="Crear cuenta nueva"
          >
            Registrar
          </button>
          
          {/* Mobile menu button - Requirements: 2.1, 14.2, 14.5 */}
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

      {/* Menú para Móvil - Requirements: 14.2, 14.3 */}
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
            {/* Auth buttons for mobile - Requirements: 2.1, 2.2, 14.2, 14.5 */}
            <div className="flex flex-col px-4 pb-2 border-t border-gray-200 mt-2 pt-4" style={{ gap: 'var(--spacing-2)' }}>
              <button 
                className="text-[#e4007c] hover:text-[#c6006b] px-4 py-3 text-sm font-medium border border-[#e4007c] rounded-lg transition-all duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2"
                style={{ minHeight: '48px' }}
                onClick={closeMenu}
                aria-label="Iniciar sesión"
              >
                Entrar
              </button>
              <button 
                className="bg-[#e4007c] hover:bg-[#c6006b] text-white px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                style={{ minHeight: '48px' }}
                onClick={closeMenu}
                aria-label="Crear cuenta nueva"
              >
                Registrar
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
