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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
      {/* Background Pattern - Premium & Dynamic */}
      <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-400 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-8rem)]">

          {/* Left Side - Hero Content */}
          <div className="text-gray-800 dark:text-gray-100 space-y-10 lg:pr-8 animate-fade-in">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-5 py-2.5 bg-white dark:bg-gray-800 rounded-full text-sm font-semibold shadow-lg border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform cursor-default">
              <span className="relative flex h-3 w-3 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500">
                ¡Únete ahora y comienza a ganar!
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-gray-900 dark:text-white tracking-tight">
                Gana hasta{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 relative">
                  $9,000
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
                {' '}semanales
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                Sé tu propio jefe. Genera ingresos flexibles con horarios que se adaptan a tu estilo de vida.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-bold text-lg mb-1">Horarios Flexibles</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tú decides cuándo conectarte</p>
              </div>

              <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                </div>
                <h3 className="font-bold text-lg mb-1">Pagos Semanales</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dinero seguro cada semana</p>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 lg:p-10 max-w-lg mx-auto w-full relative z-20 transform hover:-translate-y-1 transition-transform duration-300">
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
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">¡Bienvenido al equipo!</h2>
                  <div className="space-y-3">
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                      Tu cuenta ha sido creada exitosamente.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        📧 Revisa tu correo electrónico para verificar tu cuenta
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
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
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-pink-500 text-white font-semibold rounded-xl hover:from-primary-hover hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-pink-500 rounded-2xl mb-4 shadow-lg shadow-primary/20">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Regístrate ahora</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">Completa el formulario y comienza a ganar dinero</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm animate-fade-in">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-red-800 dark:text-red-300 font-medium text-sm mb-1">Error en el registro</h4>
                        <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Nombre completo</label>
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Correo electrónico</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-5 py-4 pr-12 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 shadow-sm bg-gray-50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white ${emailValidation === 'invalid'
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                            : emailValidation === 'valid'
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        {emailValidation === 'checking' && (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {emailValidation === 'valid' && (
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {emailValidation === 'invalid' && (
                          <div className="w-6 h-6 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    {emailValidation === 'invalid' && (
                      <p className="text-red-600 dark:text-red-400 text-sm flex items-center mt-1 ml-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Este correo ya está registrado
                      </p>
                    )}
                    {emailValidation === 'valid' && (
                      <p className="text-green-600 dark:text-green-400 text-sm flex items-center mt-1 ml-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Correo disponible
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Teléfono</label>
                    <input
                      type="tel"
                      placeholder="Número de teléfono"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-5 py-4 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 ml-1">
                      <div className={`w-2 h-2 rounded-full ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      <span>Al menos 6 caracteres</span>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 shadow-sm cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer leading-relaxed">
                        Al marcar esta casilla, aceptas nuestros{' '}
                        <a
                          href="/legal/terminos-repartidores"
                          target="_blank"
                          className="text-primary hover:text-primary-hover underline font-medium"
                        >
                          Términos y Condiciones para Repartidores
                        </a>
                        {' '}y nuestra{' '}
                        <a
                          href="/legal/privacidad"
                          target="_blank"
                          className="text-primary hover:text-primary-hover underline font-medium"
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
                    className={`w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-300 shadow-lg ${isFormValid() && !isLoading
                        ? 'bg-gradient-to-r from-primary to-pink-500 hover:from-primary-hover hover:to-pink-600 text-white hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02]'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
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
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
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

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ¿Ya tienes cuenta?{' '}
                      <a href="/login" className="text-primary hover:text-primary-hover font-semibold underline">
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
    </div>
  );
}