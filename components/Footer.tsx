// components/Footer.tsx
"use client";

import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold mb-2">Doña Repartos</h3>
            <p className="text-gray-400 text-sm">
              El sabor de tu barrio, entregado con corazón.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6" aria-label="Enlaces del pie de página">
            <Link
              href="/"
              className="text-gray-400 hover:text-[#e4007c] transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-2 py-1"
            >
              Inicio
            </Link>
            <Link
              href="/clientes"
              className="text-gray-400 hover:text-[#e4007c] transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-2 py-1"
            >
              Clientes
            </Link>
            <Link
              href="/socios"
              className="text-gray-400 hover:text-[#e4007c] transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-2 py-1"
            >
              Restaurantes
            </Link>
            <Link
              href="/repartidores"
              className="text-gray-400 hover:text-[#e4007c] transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-2 py-1"
            >
              Repartidores
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Doña Repartos. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
