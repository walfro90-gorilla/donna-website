// components/Footer.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CookieSettingsButton } from '@/components/CookieSettings';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800" role="contentinfo">
      <div className="container mx-auto px-6 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-10 lg:gap-16">

          {/* Brand section */}
          <div className="flex flex-col items-center lg:items-start space-y-4 max-w-sm text-center lg:text-left">
            <Link
              href="/"
              className="flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] rounded-lg p-1"
              aria-label="Doña Repartos - Ir a inicio"
            >
              <div className="relative transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/dona-logo-pro.png"
                  alt="Doña Repartos Logo"
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              El sabor de tu barrio, entregado con corazón. Conectamos a los mejores restaurantes locales con clientes apasionados por la buena comida.
            </p>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-wrap justify-center lg:justify-end gap-x-8 gap-y-4" aria-label="Enlaces del pie de página">
            <Link
              href="/"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] rounded px-2 py-1"
            >
              Inicio
            </Link>
            <Link
              href="/socios"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] rounded px-2 py-1"
            >
              Restaurantes
            </Link>
            <Link
              href="/registro-repartidor"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] rounded px-2 py-1"
            >
              Repartidores
            </Link>
            <Link
              href="/legal"
              className="text-gray-400 hover:text-[#e4007c] transition-colors duration-200 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] rounded px-2 py-1"
            >
              Legal
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-800"></div>

        {/* Bottom section */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">

          {/* Copyright */}
          <p className="text-gray-500 text-sm text-center lg:text-left">
            &copy; {new Date().getFullYear()} Doña Repartos. Todos los derechos reservados.
          </p>

          {/* Legal & Settings */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/legal/privacidad"
              className="text-gray-500 hover:text-[#e4007c] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] rounded px-2 py-1"
            >
              Privacidad
            </Link>
            <Link
              href="/legal/terminos"
              className="text-gray-500 hover:text-[#e4007c] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4007c] rounded px-2 py-1"
            >
              Términos
            </Link>
            <div className="flex items-center">
              <CookieSettingsButton variant="icon" />
            </div>
          </div>
        </div>

        {/* Gorilla Labs Credit */}
        <div className="mt-8 pt-6 border-t border-gray-800/50 flex justify-center">
          <a
            href="https://gorillabs.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-[#e4007c] transition-colors duration-300 flex items-center gap-1 group"
          >
            <span>Desarrollado con</span>
            <span className="animate-pulse">💚</span>
            <span>por</span>
            <span className="font-bold group-hover:underline decoration-[#e4007c] decoration-2 underline-offset-2">Gorilla Labs</span>
            <span className="text-base">🦍</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
