// components/Footer.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { CookieSettingsButton } from '@/components/CookieSettings';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white" role="contentinfo">
      {/* Main footer content with improved spacing: 2rem mobile / 3rem desktop */}
      <div className="container mx-auto px-6 py-8 lg:py-12">
        {/* Improved responsive layout: stack mobile / row desktop */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start text-center lg:text-left gap-8 lg:gap-12">
          {/* Brand section */}
          <div className="mb-0">
            <h3 className="text-lg font-bold mb-2 text-white">Doña Repartos</h3>
            <p className="text-gray-400 text-sm">
              El sabor de tu barrio, entregado con corazón.
            </p>
          </div>
          
          {/* Navigation links with improved spacing between groups - Requirements: 14.2, 14.3 */}
          <nav className="flex flex-wrap justify-center lg:justify-end gap-4 lg:gap-6" aria-label="Enlaces del pie de página" role="navigation">
            <Link
              href="/"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded px-2 py-1"
            >
              Inicio
            </Link>
            <Link
              href="/clientes"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded px-2 py-1"
            >
              Clientes
            </Link>
            <Link
              href="/socios"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded px-2 py-1"
            >
              Restaurantes
            </Link>
            <Link
              href="/registro-repartidor"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded px-2 py-1"
            >
              Repartidores
            </Link>
            <Link
              href="/legal"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded px-2 py-1"
            >
              Legal
            </Link>
          </nav>
        </div>
        
        {/* Copyright section with subtle border-top (gray-700) and improved responsive layout */}
        <div className="mt-8 border-t border-gray-700 pt-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center lg:text-left">
              &copy; {new Date().getFullYear()} Doña Repartos. Todos los derechos reservados.
            </p>
            
            {/* Legal links with improved hover states and transitions */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/legal/privacidad"
                className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded px-2 py-1"
              >
                Privacidad
              </Link>
              <Link
                href="/legal/terminos"
                className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded px-2 py-1"
              >
                Términos
              </Link>
              <CookieSettingsButton />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
