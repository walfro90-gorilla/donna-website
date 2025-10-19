// components/Footer.tsx
"use client"; // This directive marks the component as a Client Component.

import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold">Doña Repartos</h3>
            <p className="text-gray-400">El sabor de tu barrio, entregado con corazón.</p>
          </div>
          <div className="flex flex-wrap justify-center space-x-4 md:space-x-6">
            <Link href="/nosotros" className="hover:text-red-400">Nosotros</Link>
            <Link href="/blog" className="hover:text-red-400">Blog</Link>
            <Link href="/terminos" className="hover:text-red-400">Términos</Link>
            <Link href="/privacidad" className="hover:text-red-400">Privacidad</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Doña Repartos. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

