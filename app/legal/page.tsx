// app/legal/page.tsx
"use client";

import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Centro Legal de Doña Repartos
          </h1>
          
          <p className="text-gray-600 text-center mb-12">
            Encuentra toda la información legal y políticas de privacidad de nuestra plataforma
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Políticas Generales */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Políticas Generales
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <Link href="/legal/terminos" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Términos y Condiciones Generales
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Términos generales de uso de la plataforma Doña Repartos para todos los usuarios.
                  </p>
                </Link>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <Link href="/legal/privacidad" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Política de Privacidad General
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Cómo recopilamos, utilizamos y protegemos su información personal.
                  </p>
                </Link>
              </div>
            </div>

            {/* Políticas para Restaurantes */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Para Restaurantes
              </h2>
              
              <div className="bg-orange-50 rounded-lg p-6 hover:bg-orange-100 transition-colors">
                <Link href="/legal/terminos-restaurantes" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Términos para Restaurantes
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Condiciones específicas para socios restaurantes, comisiones y estándares de calidad.
                  </p>
                </Link>
              </div>

              <div className="bg-orange-50 rounded-lg p-6 hover:bg-orange-100 transition-colors">
                <Link href="/legal/privacidad-restaurantes" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Privacidad para Restaurantes
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Manejo específico de datos comerciales y información de restaurantes.
                  </p>
                </Link>
              </div>
            </div>

            {/* Políticas para Repartidores */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Para Repartidores
              </h2>
              
              <div className="bg-blue-50 rounded-lg p-6 hover:bg-blue-100 transition-colors">
                <Link href="/legal/terminos-repartidores" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Términos para Repartidores
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Condiciones para repartidores independientes, pagos y estándares de servicio.
                  </p>
                </Link>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 hover:bg-blue-100 transition-colors">
                <Link href="/legal/privacidad" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Privacidad para Repartidores
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Aplican las mismas políticas generales de privacidad con protecciones adicionales.
                  </p>
                </Link>
              </div>
            </div>

            {/* Políticas para Clientes */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Para Clientes
              </h2>
              
              <div className="bg-green-50 rounded-lg p-6 hover:bg-green-100 transition-colors">
                <Link href="/legal/terminos" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Términos para Clientes
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Los términos generales aplican para clientes con protecciones adicionales del consumidor.
                  </p>
                </Link>
              </div>

              <div className="bg-green-50 rounded-lg p-6 hover:bg-green-100 transition-colors">
                <Link href="/legal/privacidad" className="block">
                  <h3 className="text-lg font-medium text-[#e4007c] mb-2">
                    Privacidad para Clientes
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Protección de datos personales y preferencias de pedidos de nuestros clientes.
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              ¿Necesitas Ayuda Legal?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-[#e4007c] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Email Legal</h3>
                <p className="text-sm text-gray-600">legal@donarepartos.com</p>
              </div>

              <div className="text-center">
                <div className="bg-[#e4007c] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Privacidad</h3>
                <p className="text-sm text-gray-600">privacidad@donarepartos.com</p>
              </div>

              <div className="text-center">
                <div className="bg-[#e4007c] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Teléfono</h3>
                <p className="text-sm text-gray-600">+52 (55) 1234-5678</p>
              </div>
            </div>
          </div>

          {/* Última actualización */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Todas las políticas fueron actualizadas por última vez el{' '}
              {new Date().toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <Link 
              href="/"
              className="inline-block mt-4 text-[#e4007c] hover:text-[#c6006b] font-medium"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}