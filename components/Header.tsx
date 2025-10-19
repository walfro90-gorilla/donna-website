"use client";
// components/Header.tsx

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/app_icon.png"
            alt="Logo de Doña Repartos"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-xl font-bold text-gray-800 hidden md:block">
            Doña Repartos
          </span>
        </Link>

        {/* Navegación para Escritorio */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/clientes" className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium">
            Para Clientes
          </Link>
          <Link href="/socios" className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium">
            Para Restaurantes
          </Link>
          <Link href="/repartidores" className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium">
            Para Repartidores
          </Link>
        </nav>

        {/* Botón CTA y Menú Hamburguesa */}
        <div className="flex items-center space-x-4">
          <a href="#" className="bg-[#e4007c] text-white font-semibold py-2 px-6 rounded-full hover:bg-[#c6006b] transition-colors hidden md:block">
            Pide Ahora
          </a>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-800 focus:outline-none"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Menú para Móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4">
          <nav className="flex flex-col items-center space-y-4">
            <a href="/clientes" className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
              Para Clientes
            </a>
            <a href="/socios" className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
              Para Restaurantes
            </a>
            <a href="/repartidores" className="text-gray-600 hover:text-[#e4007c] transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
              Para Repartidores
            </a>
            <a href="#" className="bg-[#e4007c] text-white font-semibold py-2 px-8 rounded-full hover:bg-[#c6006b] transition-colors mt-4" onClick={() => setIsMenuOpen(false)}>
              Pide Ahora
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

