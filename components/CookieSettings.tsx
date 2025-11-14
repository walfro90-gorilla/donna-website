// components/CookieSettings.tsx
"use client";

import { useState } from 'react';
import { useCookieConsent } from '@/lib/hooks/useCookieConsent';

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookieSettings({ isOpen, onClose }: CookieSettingsProps) {
  const { consent, updateConsent, revokeConsent } = useCookieConsent();
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    functional: consent?.functional ?? false
  });

  const handleSave = () => {
    updateConsent(preferences);
    onClose();
  };

  const handleRevokeAll = () => {
    revokeConsent();
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    });
    onClose();
  };

  const handlePreferenceChange = (type: keyof typeof preferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Configuración de Cookies
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-gray-700">
              Gestiona tus preferencias de cookies. Puedes habilitar o deshabilitar diferentes 
              tipos de cookies según tus preferencias de privacidad.
            </p>

            {/* Current Status */}
            {consent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Estado Actual</h3>
                <p className="text-sm text-green-800">
                  Consentimiento otorgado el {new Date(consent.timestamp).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {/* Cookie Categories */}
            <div className="space-y-4">
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
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Propósito:</strong> Autenticación, seguridad, carrito de compras</p>
                  <p><strong>Duración:</strong> Sesión o hasta 30 días</p>
                  <p><strong>Ejemplos:</strong> session_id, csrf_token, auth_token</p>
                </div>
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
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Propósito:</strong> Análisis de tráfico, métricas de rendimiento</p>
                  <p><strong>Duración:</strong> Hasta 2 años</p>
                  <p><strong>Ejemplos:</strong> Google Analytics, métricas internas</p>
                </div>
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
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Propósito:</strong> Publicidad personalizada, remarketing</p>
                  <p><strong>Duración:</strong> Hasta 1 año</p>
                  <p><strong>Ejemplos:</strong> Facebook Pixel, Google Ads, remarketing</p>
                </div>
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
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Propósito:</strong> Chat en vivo, preferencias, configuraciones</p>
                  <p><strong>Duración:</strong> Hasta 6 meses</p>
                  <p><strong>Ejemplos:</strong> Preferencias de idioma, configuraciones UI</p>
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Información Adicional</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Puedes cambiar estas preferencias en cualquier momento</p>
                <p>• Deshabilitar cookies puede afectar la funcionalidad del sitio</p>
                <p>• Las cookies necesarias no se pueden deshabilitar</p>
                <p>• Para más información, consulta nuestra <a href="/legal/privacidad" className="underline">Política de Privacidad</a></p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRevokeAll}
                className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Revocar Todo
              </button>
              
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors font-medium"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Cookie Settings Button Component
export function CookieSettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConsentGiven } = useCookieConsent();

  // Only show if consent has been given before
  if (!isConsentGiven()) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gray-600 hover:text-[#e4007c] transition-colors"
      >
        Configuración de Cookies
      </button>
      
      <CookieSettings isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}