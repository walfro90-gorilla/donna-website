'use client';

import { useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { registerDeliveryAgentClient } from '@/lib/utils/registerDeliveryAgent';
import { useFieldValidation } from '@/lib/hooks/useFieldValidation';
// Icons as SVG components
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
import Image from 'next/image';

export default function RegistroRepartidorPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabase();

  // Field validations
  const emailValidation = useFieldValidation('email', formData.email, 'repartidor');
  // Nota: No validamos teléfono porque no hay constraint UNIQUE en la BD

  // Validación de contraseña
  const passwordValid = formData.password.length >= 6;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    const allFieldsFilled = formData.name.trim() !== '' && 
                           formData.email.trim() !== '' && 
                           formData.phone.trim() !== '' && 
                           formData.password.trim() !== '';
    const termsAccepted = acceptedTerms;
    const emailValid = emailValidation === 'valid';
    const passwordsValid = passwordValid;
    
    return allFieldsFilled && termsAccepted && emailValid && passwordsValid;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerDeliveryAgentClient(supabase, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      if (result.ok) {
        setIsSuccess(true);
        if (result.error) {
          // Partial success with warning
          setError(result.error);
        }
      } else {
        setError(result.error || 'Hubo un error al procesar tu registro.');
      }
      
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError('Hubo un error inesperado. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative">
      {/* Background Pattern - Más sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#e4007c] rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-400 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-screen">
          
          {/* Left Side - Hero Content */}
          <div className="text-gray-800 space-y-8 lg:pr-8">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#e4007c] to-pink-500 text-white rounded-full text-sm font-medium shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              ¡Únete ahora y comienza a ganar!
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-gray-900">
                Gana hasta{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e4007c] to-orange-500">
                  $9,000 MXN
                </span>
                {' '}semanales repartiendo
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                Únete a miles de repartidores que ya están generando ingresos flexibles con horarios que se adaptan a tu vida.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-800">Horarios flexibles</span>
                  <p className="text-sm text-gray-600">Trabaja cuando quieras, donde quieras</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-800">Pagos semanales</span>
                  <p className="text-sm text-gray-600">Recibe tu dinero cada semana</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-800">Propinas extra</span>
                  <p className="text-sm text-gray-600">Gana más con las propinas de clientes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-800">Soporte 24/7</span>
                  <p className="text-sm text-gray-600">Ayuda cuando la necesites</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-6 lg:p-8 max-w-lg mx-auto w-full">
            {isSuccess ? (
              <div className="text-center space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce"></div>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">¡Bienvenido al equipo!</h2>
                  <div className="space-y-3">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Tu cuenta ha sido creada exitosamente. 
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-800 font-medium">
                        📧 Revisa tu correo electrónico para verificar tu cuenta
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800">
                        ⏳ Nuestro equipo revisará tu solicitud y te contactaremos en las próximas 24-48 horas
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      confirmPassword: ''
                    });
                    setAcceptedTerms(false);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#e4007c] to-pink-500 text-white font-semibold rounded-xl hover:from-[#c6006b] hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Registrar otro repartidor
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#e4007c] to-pink-500 rounded-2xl mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Regístrate ahora</h2>
                  <p className="text-gray-600 text-lg">Completa el formulario y comienza a ganar dinero</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-red-800 font-medium text-sm mb-1">Error en el registro</h4>
                        <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

            <form className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] outline-none transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] outline-none transition-all duration-200 shadow-sm ${
                      emailValidation === 'invalid' 
                        ? 'border-red-300 bg-red-50 focus:bg-red-50' 
                        : emailValidation === 'valid' 
                        ? 'border-green-300 bg-green-50 focus:bg-green-50' 
                        : 'border-gray-300 bg-gray-50 focus:bg-white'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {emailValidation === 'checking' && (
                      <div className="w-5 h-5 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {emailValidation === 'valid' && (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {emailValidation === 'invalid' && (
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {emailValidation === 'invalid' && (
                  <p className="text-red-600 text-sm flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Este correo ya está registrado
                  </p>
                )}
                {emailValidation === 'valid' && (
                  <p className="text-green-600 text-sm flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Correo disponible
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  placeholder="Número de teléfono"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] outline-none transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] outline-none transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  <span>Al menos 6 caracteres</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-[#e4007c] border-gray-300 rounded focus:ring-[#e4007c] focus:ring-2 shadow-sm"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                    Al marcar esta casilla, aceptas nuestros{' '}
                    <a 
                      href="/legal/terminos-repartidores" 
                      target="_blank" 
                      className="text-[#e4007c] hover:text-[#c6006b] underline font-medium"
                    >
                      Términos y Condiciones para Repartidores
                    </a>
                    {' '}y nuestra{' '}
                    <a 
                      href="/legal/privacidad" 
                      target="_blank" 
                      className="text-[#e4007c] hover:text-[#c6006b] underline font-medium"
                    >
                      Política de Privacidad
                    </a>
                    . También aceptas recibir comunicaciones por WhatsApp, llamadas o SMS relacionadas con el servicio.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid() || isLoading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                  isFormValid() && !isLoading
                    ? 'bg-gradient-to-r from-[#e4007c] to-pink-500 hover:from-[#c6006b] hover:to-pink-600 text-white hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creando tu cuenta...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>¡Comenzar a ganar dinero!</span>
                  </div>
                )}
              </button>
            </form>

                {/* Additional Info */}
                <div className="mt-8 text-center space-y-4">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Datos seguros</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Registro gratuito</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Proceso rápido</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">
                      ¿Ya tienes cuenta?{' '}
                      <a href="/login" className="text-[#e4007c] hover:text-[#c6006b] font-semibold underline">
                        Inicia sesión aquí
                      </a>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-900/5 to-transparent pointer-events-none"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#e4007c] rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-orange-400 rounded-full animate-bounce opacity-40" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-50" style={{animationDelay: '2s'}}></div>
    </div>
  );
}