// app/clientes/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { RegistrationStep } from '@/components/forms/StepperForm';
import { LazyRegistrationComponents, preloadUserTypeComponents } from '@/components/registration/lazy';
import { LoadingSpinner, TimeoutHandler } from '@/components/ui';
import { handleError, retryWithBackoff } from '@/lib/utils/errorHandler';
import type { Address } from '@/types/address';

// Icono para la sección de beneficios
const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function ClientesPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const supabase = useSupabase();

  // Preload customer components when component mounts
  useEffect(() => {
    preloadUserTypeComponents('customer');
  }, []);

  // Define registration steps
  const registrationSteps: RegistrationStep[] = [
    {
      id: 'personal-info',
      title: 'Información Personal',
      description: 'Cuéntanos sobre ti',
      component: LazyRegistrationComponents.CustomerPersonalInformationStep,
      validation: async (data) => {
        const errors: Record<string, string> = {};
        
        if (!data.name?.trim()) {
          errors.name = 'El nombre es requerido';
        }
        
        if (!data.email?.trim()) {
          errors.email = 'El correo electrónico es requerido';
        }
        
        if (!data.phone?.trim()) {
          errors.phone = 'El teléfono es requerido';
        }

        if (!data.termsAccepted) {
          errors.termsAccepted = 'Debes aceptar los términos y condiciones';
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors
        };
      }
    },
    {
      id: 'address-setup',
      title: 'Direcciones',
      description: 'Configura tus direcciones de entrega',
      component: LazyRegistrationComponents.AddressSetupStep,
      validation: async (data) => {
        const errors: Record<string, string> = {};
        
        if (!data.primaryAddress && (!data.savedAddresses || data.savedAddresses.length === 0)) {
          errors.primaryAddress = 'Debes agregar al menos una dirección';
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors
        };
      }
    },
    {
      id: 'account-security',
      title: 'Seguridad',
      description: 'Configura tu contraseña y preferencias',
      component: LazyRegistrationComponents.AccountSecurityStep,
      validation: async (data) => {
        const errors: Record<string, string> = {};
        
        if (!data.password) {
          errors.password = 'La contraseña es requerida';
        } else if (data.password.length < 8) {
          errors.password = 'La contraseña debe tener al menos 8 caracteres';
        }
        
        if (data.password !== data.confirmPassword) {
          errors.confirmPassword = 'Las contraseñas no coinciden';
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors
        };
      }
    },
    {
      id: 'restaurant-discovery',
      title: 'Descubre Restaurantes',
      description: 'Encuentra tus restaurantes favoritos',
      component: LazyRegistrationComponents.RestaurantDiscoveryStep,
      isOptional: true,
      validation: async () => ({ isValid: true })
    }
  ];

  const handleRegistrationComplete = async (formData: any) => {
    setIsLoading(true);
    try {
      await retryWithBackoff(async () => {
      // Get the primary address (either from savedAddresses or primaryAddress)
      const primaryAddress = formData.savedAddresses?.find((addr: any) => addr.isDefault) || 
                           formData.savedAddresses?.[0] || 
                           formData.primaryAddress;

      if (!primaryAddress) {
        throw new Error('No se encontró una dirección válida');
      }

      // Create user account
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'cliente',
            name: formData.name,
            phone: formData.phone,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          throw new Error('Este correo electrónico ya está registrado.');
        }
        throw signUpError;
      }

      if (!user) {
        throw new Error('No se pudo crear el usuario.');
      }

      // Register client profile in database
      const { error: rpcError } = await supabase.rpc('register_client_v2', {
        p_user_id: user.id,
        p_email: formData.email,
        p_name: formData.name,
        p_phone: formData.phone,
        p_address: primaryAddress.address,
        p_address_structured: primaryAddress.address_structured,
        p_location_lat: primaryAddress.location_lat,
        p_location_lon: primaryAddress.location_lon,
        p_location_place_id: primaryAddress.location_place_id
      });

      if (rpcError) {
        console.error('Error en la RPC post-registro:', rpcError);
        throw new Error('Se creó tu cuenta, pero hubo un problema al registrar tu perfil.');
      }

      // Update user metadata
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { 
          name: formData.name,
          preferences: {
            cuisines: formData.preferredCuisines || [],
            notifications: {
              marketing: formData.marketingEmails,
              orders: formData.orderNotifications,
              sms: formData.promotionalSms,
              push: formData.pushNotifications
            },
            twoFactor: formData.twoFactorEnabled
          }
        }
      });

      if (updateUserError) {
        console.warn('Post-registration: Could not update user preferences.', updateUserError);
      }

      // Store additional addresses if any
      if (formData.savedAddresses && formData.savedAddresses.length > 1) {
        // TODO: Store additional addresses in a separate table
        console.log('Additional addresses to store:', formData.savedAddresses);
      }

      // Store favorite restaurants if any
      if (formData.favoriteRestaurants && formData.favoriteRestaurants.length > 0) {
        // TODO: Store favorite restaurants
        console.log('Favorite restaurants to store:', formData.favoriteRestaurants);
      }

        setSubmittedEmail(formData.email);
        setIsSubmitted(true);
      }, {
        maxRetries: 3,
        baseDelay: 1000
      });

    } catch (error) {
      const errorResult = handleError(error as Error, 'customer-registration');
      throw new Error(errorResult.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white min-h-screen">
        {/* Success Page */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <svg
                  className="w-20 h-20 text-green-500 mx-auto mb-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                ¡Bienvenido a Doña Repartos!
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Tu cuenta ha sido creada exitosamente. Hemos enviado un correo de confirmación a{' '}
                <strong className="text-gray-900">{submittedEmail}</strong>.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Próximos pasos:
                </h3>
                <ol className="text-left text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">1</span>
                    Revisa tu bandeja de entrada y confirma tu correo electrónico
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">2</span>
                    Inicia sesión en tu nueva cuenta
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">3</span>
                    ¡Comienza a explorar y hacer tu primer pedido!
                  </li>
                </ol>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-8 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors font-medium"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (showRegistration) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-6">
          <TimeoutHandler
            isLoading={isLoading}
            timeout={60000}
            onTimeout={() => {
              setIsLoading(false);
            }}
          >
            <LazyRegistrationComponents.StepperForm
              steps={registrationSteps}
              onComplete={handleRegistrationComplete}
              persistKey="customer-registration"
              allowSkipOptional={true}
            />
          </TimeoutHandler>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#fef2f9] py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 mb-4">
            Disfruta de tu comida favorita <br className="hidden md:block" />
            en la comodidad de tu hogar.
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Pide de los mejores restaurantes locales y recibe tu comida caliente y deliciosa.
          </p>
        </div>
      </section>

      {/* Sección de Beneficios y CTA */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Columna de Beneficios */}
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">
                ¿Por qué elegir Doña Repartos?
              </h2>
              <ul className="space-y-5 md:space-y-6">
                <li className="flex items-start">
                  <CheckCircleIcon />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-800 mb-1">
                      Restaurantes Locales
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Apoya a los negocios de tu comunidad y disfruta de sabores auténticos.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-800 mb-1">
                      Entrega Rápida
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Tu comida llega caliente y a tiempo, directo a tu puerta.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-800 mb-1">
                      Fácil de Usar
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Pedir es simple, rápido y seguro. Todo desde tu teléfono o computadora.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-800 mb-1">
                      Registro Inteligente
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Proceso de registro paso a paso con recomendaciones personalizadas.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Columna de CTA */}
            <div className="order-1 lg:order-2">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    ¡Únete a Doña Repartos!
                  </h3>
                  <p className="text-gray-600">
                    Crea tu cuenta en solo 3 pasos y descubre los mejores restaurantes cerca de ti.
                  </p>
                </div>

                {/* Registration Features */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#e4007c] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-gray-700">Información personal y contacto</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#e4007c] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-gray-700">Configura tus direcciones de entrega</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#e4007c] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-gray-700">Seguridad y preferencias</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Descubre restaurantes (opcional)</span>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-6">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      Acepto los{' '}
                      <a 
                        href="/legal/terminos" 
                        target="_blank"
                        className="text-[#e4007c] hover:text-[#c6006b] underline font-medium"
                      >
                        Términos y Condiciones
                      </a>
                      {' '}y la{' '}
                      <a 
                        href="/legal/privacidad" 
                        target="_blank"
                        className="text-[#e4007c] hover:text-[#c6006b] underline font-medium"
                      >
                        Política de Privacidad
                      </a>
                    </span>
                  </label>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setShowRegistration(true)}
                  disabled={!termsAccepted}
                  className={`w-full px-8 py-4 rounded-lg transition-colors font-semibold text-lg shadow-lg hover:shadow-xl ${
                    termsAccepted 
                      ? 'bg-[#e4007c] text-white hover:bg-[#c6006b] cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Comenzar Registro
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  ¿Ya tienes cuenta?{' '}
                  <a href="/login" className="text-[#e4007c] hover:text-[#c6006b] font-medium">
                    Inicia sesión aquí
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

