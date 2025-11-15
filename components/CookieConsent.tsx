// components/CookieConsent.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function CookieConsent() {
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: true,
    marketing: true,
    functional: true
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    setShowModal(false);
    
    // Initialize analytics and other services
    initializeServices(consentData);
  };

  const handleAcceptSelected = () => {
    const consentData = {
      ...preferences,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    setShowModal(false);
    
    // Initialize only selected services
    initializeServices(consentData);
  };

  const handleRejectAll = () => {
    const consentData = {
      necessary: true, // Only necessary cookies
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    setShowModal(false);
    
    // Initialize only necessary services
    initializeServices(consentData);
  };

  const initializeServices = (consent: any) => {
    // Initialize Google Analytics if analytics is enabled
    if (consent.analytics && typeof window !== 'undefined') {
      // Example: Initialize GA4
      // gtag('config', 'GA_MEASUREMENT_ID');
      console.log('Analytics initialized');
    }

    // Initialize marketing pixels if marketing is enabled
    if (consent.marketing && typeof window !== 'undefined') {
      // Example: Initialize Facebook Pixel, Google Ads, etc.
      console.log('Marketing cookies initialized');
    }

    // Initialize functional cookies if enabled
    if (consent.functional && typeof window !== 'undefined') {
      // Example: Initialize chat widgets, preference storage, etc.
      console.log('Functional cookies initialized');
    }
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!showModal) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#e4007c] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Configuración de Cookies
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              En Doña Repartos utilizamos cookies y tecnologías similares para mejorar tu experiencia, 
              personalizar contenido y analizar nuestro tráfico. Puedes elegir qué tipos de cookies 
              aceptar o rechazar todas las opcionales.
            </p>

            {!showDetails ? (
              /* Simple View */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">¿Qué son las cookies?</h3>
                  <p className="text-sm text-blue-800">
                    Las cookies son pequeños archivos que se almacenan en tu dispositivo para 
                    mejorar tu experiencia de navegación y permitir ciertas funcionalidades.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowDetails(true)}
                    className="text-[#e4007c] hover:text-[#c6006b] text-sm font-medium"
                  >
                    Ver detalles y configurar
                  </button>
                  <Link
                    href="/legal/privacidad"
                    className="text-gray-600 hover:text-gray-800 text-sm"
                    target="_blank"
                  >
                    Política de Privacidad
                  </Link>
                </div>
              </div>
            ) : (
              /* Detailed View */
              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Cookies Necesarias</h3>
                      <p className="text-sm text-gray-600">
                        Esenciales para el funcionamiento básico del sitio
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Siempre activas</span>
                      <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Incluyen: autenticación, seguridad, carrito de compras, preferencias básicas
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Cookies de Análisis</h3>
                      <p className="text-sm text-gray-600">
                        Nos ayudan a entender cómo usas nuestro sitio
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                        preferences.analytics ? 'bg-[#e4007c] justify-end' : 'bg-gray-300 justify-start'
                      }`}>
                        <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Incluyen: Google Analytics, métricas de rendimiento, análisis de uso
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Cookies de Marketing</h3>
                      <p className="text-sm text-gray-600">
                        Para mostrarte contenido y ofertas relevantes
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                        preferences.marketing ? 'bg-[#e4007c] justify-end' : 'bg-gray-300 justify-start'
                      }`}>
                        <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Incluyen: Facebook Pixel, Google Ads, remarketing, personalización
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Cookies Funcionales</h3>
                      <p className="text-sm text-gray-600">
                        Mejoran la funcionalidad y personalización
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                        preferences.functional ? 'bg-[#e4007c] justify-end' : 'bg-gray-300 justify-start'
                      }`}>
                        <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Incluyen: chat en vivo, preferencias de idioma, configuraciones personalizadas
                  </p>
                </div>

                <button
                  onClick={() => setShowDetails(false)}
                  className="text-[#e4007c] hover:text-[#c6006b] text-sm font-medium"
                >
                  ← Volver a vista simple
                </button>
              </div>
            )}
          </div>

          {/* Footer - Requirements: 2.1, 2.2, 14.5 */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                style={{ minHeight: '48px' }}
              >
                Rechazar Opcionales
              </button>
              
              {showDetails && (
                <button
                  onClick={handleAcceptSelected}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  style={{ minHeight: '48px' }}
                >
                  Guardar Selección
                </button>
              )}
              
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors font-medium"
                style={{ minHeight: '48px' }}
              >
                Aceptar Todas
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Puedes cambiar tus preferencias en cualquier momento desde la configuración de cookies.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}