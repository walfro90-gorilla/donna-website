'use client';

import { useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { registerDeliveryAgentClient } from '@/lib/utils/registerDeliveryAgent';
import { useFieldValidation } from '@/lib/hooks/useFieldValidation';
import Image from 'next/image';
import Link from 'next/link';
import { CountryCodeSelector } from '@/components/ui/CountryCodeSelector';

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
  const [lada, setLada] = useState('+52');

  const supabase = useSupabase();

  // Construct full phone for validation
  const fullPhone = lada + formData.phone;

  const emailValidation = useFieldValidation('email', formData.email, 'repartidor');
  const phoneValidation = useFieldValidation('phone', fullPhone, 'repartidor');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const isFormValid = () => {
    return (
      formData.name.length >= 3 &&
      formData.email.length > 0 &&
      emailValidation === 'valid' &&
      formData.phone.length >= 10 &&
      phoneValidation === 'valid' &&
      formData.password.length >= 6 &&
      acceptedTerms
    );
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
        phone: fullPhone
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left Side - Hero Content with Background */}
        <div className="flex-1 relative overflow-hidden min-h-[40vh] lg:min-h-screen">
          {/* Background Image - Desktop */}
          <div
            className="hidden lg:block absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage: "url('/images/delivery-hero-desktop-final.jpg')"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40"></div>
          </div>

          {/* Background Image - Mobile */}
          <div
            className="block lg:hidden absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage: "url('/images/delivery-hero-new.jpg')"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-16 text-white h-full flex flex-col justify-center lg:justify-start lg:pt-20 animate-fade-in">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs lg:text-sm font-semibold border border-white/20 transform hover:scale-105 transition-transform cursor-default w-fit mb-8">
              <span className="relative flex h-2.5 w-2.5 mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-white">
                ¡Únete ahora y comienza a ganar!
              </span>
            </div>

            <div className="space-y-6 mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Gana hasta{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 relative whitespace-nowrap">
                  $9,000
                  <svg className="absolute w-full h-2 -bottom-1 left-0 text-primary opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
                {' '}semanales
              </h1>
              <p className="text-lg lg:text-xl text-gray-200 leading-relaxed font-light max-w-2xl">
                Sé tu propio jefe. Genera ingresos flexibles con horarios que se adaptan a tu estilo de vida.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/20 transition-colors group">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-bold text-lg mb-1 text-white">Horarios Flexibles</h3>
                <p className="text-sm text-gray-300">Tú decides cuándo conectarte</p>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/20 transition-colors group">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                </div>
                <h3 className="font-bold text-lg mb-1 text-white">Pagos Semanales</h3>
                <p className="text-sm text-gray-300">Dinero seguro cada semana</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:max-w-xl bg-white dark:bg-gray-800 p-6 lg:p-12 shadow-2xl overflow-y-auto relative z-20 lg:-ml-10 lg:my-10 lg:rounded-l-3xl border-l border-gray-100 dark:border-gray-700">
          {isSuccess ? (
            <div className="text-center space-y-6 lg:space-y-8 py-8">
              <div className="relative">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full animate-bounce"></div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">¡Bienvenido al equipo!</h2>
                <div className="space-y-3">
                  <p className="text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    Tu cuenta ha sido creada exitosamente.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 lg:p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                      📧 Revisa tu correo electrónico para verificar tu cuenta
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 lg:p-4">
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
                    password: ''
                  });
                  setAcceptedTerms(false);
                }}
                className="w-full inline-flex justify-center items-center px-6 py-3.5 bg-gradient-to-r from-primary to-pink-500 text-white font-semibold rounded-xl hover:from-primary-hover hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Registrar otro repartidor
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 lg:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-primary to-pink-500 rounded-xl lg:rounded-2xl mb-3 lg:mb-4 shadow-lg shadow-primary/20">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 lg:mb-2">Regístrate ahora</h2>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Completa el formulario y comienza a ganar</p>
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

              <form className="space-y-4 lg:space-y-5">
                {/* Name Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Nombre completo</label>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white shadow-sm text-base"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Correo electrónico</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3.5 pr-12 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 shadow-sm bg-gray-50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white text-base ${emailValidation === 'invalid'
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
                    <p className="text-red-600 dark:text-red-400 text-xs flex items-center mt-1 ml-1">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Este correo ya está registrado
                    </p>
                  )}
                  {emailValidation === 'valid' && (
                    <p className="text-green-600 dark:text-green-400 text-xs flex items-center mt-1 ml-1">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Correo disponible
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Teléfono</label>
                  <div className="relative">
                    <div className={`flex items-center border rounded-xl transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 ${phoneValidation === 'invalid'
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                      : phoneValidation === 'valid'
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                        : 'border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent'
                      }`}>
                      {/* Lada Selector */}
                      <div className="border-r border-gray-200 dark:border-gray-600">
                        <CountryCodeSelector
                          value={lada}
                          onChange={setLada}
                        />
                      </div>

                      {/* Phone Input */}
                      <input
                        type="tel"
                        placeholder="Tu número de teléfono"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3.5 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                      />

                      {/* Validation Status Icon */}
                      <div className="pr-4 flex items-center">
                        {phoneValidation === 'checking' && (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {phoneValidation === 'valid' && (
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {phoneValidation === 'invalid' && (
                          <div className="w-6 h-6 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {phoneValidation === 'invalid' && (
                    <p className="text-red-600 dark:text-red-400 text-xs flex items-center mt-1 ml-1">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Este teléfono ya está registrado
                    </p>
                  )}
                  {phoneValidation === 'valid' && (
                    <p className="text-green-600 dark:text-green-400 text-xs flex items-center mt-1 ml-1">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Teléfono disponible
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white shadow-sm text-base"
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
                    <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <span>Al menos 6 caracteres</span>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 lg:p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 shadow-sm cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 cursor-pointer leading-relaxed">
                      Al marcar esta casilla, aceptas nuestros{' '}
                      <Link
                        href="/legal/terminos-repartidores"
                        target="_blank"
                        className="text-primary hover:text-primary-hover underline font-medium"
                      >
                        Términos y Condiciones
                      </Link>
                      {' '}y{' '}
                      <Link
                        href="/legal/privacidad"
                        target="_blank"
                        className="text-primary hover:text-primary-hover underline font-medium"
                      >
                        Política de Privacidad
                      </Link>
                      .
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isLoading}
                  className={`w-full py-3.5 lg:py-4 px-6 rounded-full font-bold text-lg transition-all duration-300 shadow-lg ${isFormValid() && !isLoading
                    ? 'bg-gradient-to-r from-primary to-pink-500 hover:from-primary-hover hover:to-pink-600 text-white hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 lg:w-6 lg:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creando cuenta...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>¡Comenzar a ganar!</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Additional Info */}
              <div className="mt-6 lg:mt-8 text-center space-y-4">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Datos seguros</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Gratis</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Rápido</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" className="text-primary hover:text-primary-hover font-semibold underline">
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}