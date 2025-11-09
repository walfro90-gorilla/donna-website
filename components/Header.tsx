// components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2" onClick={closeMenu} aria-label="Ir a inicio">
          <Image
            src="/app_icon.png"
            alt="Logo de Doña Repartos"
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
          <span className="text-lg sm:text-xl font-bold text-gray-800 hidden sm:block">
            Doña Repartos
          </span>
        </Link>

        {/* Navegación para Escritorio */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8" aria-label="Navegación principal">
          <Link
            href="/clientes"
            className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 rounded px-2 py-1"
            aria-label="Registro para clientes"
          >
            Para Clientes
          </Link>
          <Link
            href="/socios"
            className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 rounded px-2 py-1"
            aria-label="Registro para restaurantes"
          >
            Para Restaurantes
          </Link>
          <Link
            href="/repartidores"
            className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 rounded px-2 py-1"
            aria-label="Registro para repartidores"
          >
            Para Repartidores
          </Link>
        </nav>

        {/* Botón CTA y Menú Hamburguesa */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/clientes"
            className="bg-[#e4007c] text-white font-semibold py-2 px-4 sm:px-6 rounded-full hover:bg-[#c6006b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 hidden md:block"
            aria-label="Pide ahora"
          >
            Pide Ahora
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 rounded p-1"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
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

      {/* Menú para Móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col items-stretch px-4 space-y-2" aria-label="Navegación móvil">
            <Link
              href="/clientes"
              className="text-gray-600 hover:text-[#e4007c] hover:bg-[#fef2f9] transition-colors font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2"
              onClick={closeMenu}
            >
              Para Clientes
            </Link>
            <Link
              href="/socios"
              className="text-gray-600 hover:text-[#e4007c] hover:bg-[#fef2f9] transition-colors font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2"
              onClick={closeMenu}
            >
              Para Restaurantes
            </Link>
            <Link
              href="/repartidores"
              className="text-gray-600 hover:text-[#e4007c] hover:bg-[#fef2f9] transition-colors font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2"
              onClick={closeMenu}
            >
              Para Repartidores
            </Link>
            <Link
              href="/clientes"
              className="bg-[#e4007c] text-white font-semibold py-3 px-6 rounded-full hover:bg-[#c6006b] transition-colors mt-4 text-center focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2"
              onClick={closeMenu}
            >
              Pide Ahora
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
