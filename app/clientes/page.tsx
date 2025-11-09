// app/clientes/page.tsx
"use client";

import { useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useFieldValidation } from '@/lib/hooks/useFieldValidation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import FormField from '@/components/FormField';
import FormButton from '@/components/FormButton';
import PasswordStrength from '@/components/PasswordStrength';
import ErrorMessage from '@/components/ErrorMessage';
import { handleError } from '@/lib/utils/errorHandler';
import { getPasswordStrength } from '@/lib/utils/validation';
import type { Address } from '@/types/address';
import type { ClientFormData } from '@/types/form';

// Icono para la sección de beneficios
const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function ClientesPage() {
  const [formState, setFormState] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const [addressDetails, setAddressDetails] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const supabase = useSupabase();

  const emailValidation = useFieldValidation('email', formState.email, 'cliente');
  const phoneValidation = useFieldValidation('phone', formState.phone, 'cliente');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));

    // Calcular fuerza de contraseña en tiempo real
    if (id === 'password') {
      setPasswordStrength(value.length > 0 ? getPasswordStrength(value) : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (emailValidation !== 'valid' || phoneValidation !== 'valid') {
      setError('Por favor, corrige los campos marcados antes de continuar.');
      return;
    }

    if (!addressDetails) {
      setError('Por favor, selecciona una dirección válida de la lista.');
      return;
    }

    if (!passwordStrength || passwordStrength === 'weak') {
      setError('Por favor, usa una contraseña más segura.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formState.email,
        password: formState.password,
        options: {
          data: {
            role: 'cliente',
            name: formState.name,
            phone: formState.phone,
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

      // Registrar perfil de cliente en la base de datos
      const { error: rpcError } = await supabase.rpc('register_client_v2', {
        p_user_id: user.id,
        p_email: formState.email,
        p_name: formState.name,
        p_phone: formState.phone,
        p_address: addressDetails.address,
        p_address_structured: addressDetails.address_structured,
        p_location_lat: addressDetails.location_lat,
        p_location_lon: addressDetails.location_lon,
        p_location_place_id: addressDetails.location_place_id
      });

      if (rpcError) {
        console.error('Error en la RPC post-registro:', rpcError);
        throw new Error('Se creó tu cuenta, pero hubo un problema al registrar tu perfil.');
      }

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { name: formState.name }
      });

      if (updateUserError) {
        console.warn('Post-registration: Could not update user name.', updateUserError);
      }

      setIsSubmitted(true);

    } catch (error) {
      const errorResult = handleError(error, 'registration');
      setError(errorResult.message);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Sección de Beneficios y Formulario */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
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
              </ul>
            </div>

            {/* Columna de Formulario */}
            <div className="order-1 lg:order-2 bg-white p-6 md:p-8 rounded-lg shadow-xl">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 text-green-500 mx-auto"
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
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">¡Bienvenido a Doña Repartos!</h3>
                  <p className="text-gray-600 mb-2">
                    Hemos enviado un correo a <strong className="text-gray-800">{formState.email}</strong>.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Por favor, revisa tu bandeja de entrada para confirmar tu cuenta y completar el registro.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    ¡Crea tu cuenta!
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6" noValidate>
                    <FormField
                      label="Nombre Completo"
                      id="name"
                      type="text"
                      value={formState.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Juan Pérez"
                      minLength={2}
                    />

                    <FormField
                      label="Correo Electrónico"
                      id="email"
                      type="email"
                      value={formState.email}
                      onChange={handleInputChange}
                      required
                      placeholder="tu@email.com"
                      validationStatus={emailValidation}
                      validationMessage={
                        emailValidation === 'valid'
                          ? '¡Correo disponible!'
                          : emailValidation === 'invalid'
                          ? 'Este correo ya está en uso.'
                          : undefined
                      }
                    />

                    <FormField
                      label="Teléfono"
                      id="phone"
                      type="tel"
                      value={formState.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="123-456-7890"
                      validationStatus={phoneValidation}
                      validationMessage={
                        phoneValidation === 'valid'
                          ? 'Teléfono disponible'
                          : phoneValidation === 'invalid'
                          ? 'Este teléfono ya está en uso.'
                          : undefined
                      }
                    />

                    {/* Campo de Dirección */}
                    <div>
                      <AddressAutocomplete
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                        onAddressSelect={setAddressDetails}
                      />
                      {!addressDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          Empieza a escribir tu dirección para ver opciones
                        </p>
                      )}
                      {addressDetails && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Dirección seleccionada
                        </p>
                      )}
                    </div>

                    <div>
                      <FormField
                        label="Contraseña"
                        id="password"
                        type="password"
                        value={formState.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                        helpText="Debe contener mayúsculas, minúsculas y números"
                      />
                      <PasswordStrength password={formState.password} />
                    </div>

                    {error && <ErrorMessage message={error} />}

                    <FormButton
                      type="submit"
                      isLoading={isLoading}
                      disabled={
                        isLoading ||
                        !addressDetails ||
                        emailValidation !== 'valid' ||
                        phoneValidation !== 'valid' ||
                        !passwordStrength ||
                        passwordStrength === 'weak'
                      }
                      fullWidth
                    >
                      {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </FormButton>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

