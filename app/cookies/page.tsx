// app/cookies/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useCookieConsent } from '@/lib/hooks/useCookieConsent';

export default function CookiesPage() {
  const { consent, updateConsent, revokeConsent } = useCookieConsent();
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    functional: consent?.functional ?? false
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    updateConsent(preferences);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleRevokeAll = () => {
    revokeConsent();
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePreferenceChange = (type: keyof typeof preferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Configuración de Cookies
          </h1>
          
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">
                  Preferencias guardadas exitosamente
                </span>
              </div>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-8">
              Gestiona tus preferencias de cookies para personalizar tu experiencia en Doña Repartos. 
              Puedes habilitar o deshabilitar diferentes tipos de cookies según tus preferencias de privacidad.
            </p>

            {/* Current Status */}
            {consent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">Estado Actual</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-800">
                      <strong>Consentimiento otorgado:</strong><br />
                      {new Date(consent.timestamp).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-800">
                      <strong>Versión de política:</strong> {consent.version}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cookie Categories */}
            <div className="space-y-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Tipos de Cookies</h2>

              {/* Necessary Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Cookies Necesarias</h3>
                    <p className="text-gray-600">
                      Esenciales para el funcionamiento básico del sitio web
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-3">Siempre activas</span>
                    <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Propósito:</strong> Autenticación de usuarios, seguridad, carrito de compras, preferencias básicas</p>
                  <p><strong>Duración:</strong> Sesión del navegador o hasta 30 días</p>
                  <p><strong>Ejemplos:</strong> session_id, csrf_token, auth_token, cart_items</p>
                  <p><strong>Nota:</strong> Estas cookies no se pueden deshabilitar ya que son necesarias para el funcionamiento del sitio.</p>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Cookies de Análisis</h3>
                    <p className="text-gray-600">
                      Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.analytics ? 'bg-[#e4007c] justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                    </div>
                  </label>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Propósito:</strong> Análisis de tráfico web, métricas de rendimiento, comportamiento de usuarios</p>
                  <p><strong>Duración:</strong> Hasta 2 años</p>
                  <p><strong>Ejemplos:</strong> Google Analytics (_ga, _gid), métricas internas de rendimiento</p>
                  <p><strong>Beneficios:</strong> Nos permite mejorar la experiencia del usuario y optimizar nuestros servicios</p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Cookies de Marketing</h3>
                    <p className="text-gray-600">
                      Para mostrarte contenido y ofertas personalizadas y relevantes
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.marketing ? 'bg-[#e4007c] justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                    </div>
                  </label>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Propósito:</strong> Publicidad personalizada, remarketing, seguimiento de conversiones</p>
                  <p><strong>Duración:</strong> Hasta 1 año</p>
                  <p><strong>Ejemplos:</strong> Facebook Pixel (_fbp), Google Ads (conversion tracking), remarketing tags</p>
                  <p><strong>Beneficios:</strong> Recibes ofertas y contenido más relevante para tus intereses</p>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Cookies Funcionales</h3>
                    <p className="text-gray-600">
                      Mejoran la funcionalidad del sitio y tu experiencia de usuario
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences.functional ? 'bg-[#e4007c] justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                    </div>
                  </label>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Propósito:</strong> Chat en vivo, preferencias de usuario, configuraciones personalizadas</p>
                  <p><strong>Duración:</strong> Hasta 6 meses</p>
                  <p><strong>Ejemplos:</strong> Preferencias de idioma, configuraciones de interfaz, historial de chat</p>
                  <p><strong>Beneficios:</strong> El sitio recuerda tus preferencias y configuraciones personalizadas</p>
                </div>
              </div>
            </div>

            {/* Information Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">Información Importante</h3>
              <div className="text-sm text-yellow-800 space-y-2">
                <p>• <strong>Cambios:</strong> Puedes modificar estas preferencias en cualquier momento</p>
                <p>• <strong>Funcionalidad:</strong> Deshabilitar ciertas cookies puede afectar la funcionalidad del sitio</p>
                <p>• <strong>Navegador:</strong> También puedes gestionar cookies desde la configuración de tu navegador</p>
                <p>• <strong>Más información:</strong> Consulta nuestra <Link href="/legal/privacidad" className="underline font-medium">Política de Privacidad</Link> para detalles completos</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRevokeAll}
                className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Revocar Todas las Cookies
              </button>
              
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors font-medium"
              >
                Guardar Preferencias
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/legal/privacidad"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium text-center"
              >
                Política de Privacidad
              </Link>
              <Link 
                href="/legal/terminos"
                className="text-[#e4007c] hover:text-[#c6006b] font-medium text-center"
              >
                Términos y Condiciones
              </Link>
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-800 text-center"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}