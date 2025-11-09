// app/repartidores/page.tsx
"use client";

import { useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useFieldValidation } from '@/lib/hooks/useFieldValidation';
import FormField from '@/components/FormField';
import FormButton from '@/components/FormButton';
import PasswordStrength from '@/components/PasswordStrength';
import ErrorMessage from '@/components/ErrorMessage';
import { handleError } from '@/lib/utils/errorHandler';
import { getPasswordStrength } from '@/lib/utils/validation';
import type { DeliveryDriverFormData } from '@/types/form';

// Icono para la sección de beneficios
const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function RepartidoresPage() {
  const [formState, setFormState] = useState<DeliveryDriverFormData>({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const supabase = useSupabase();

  const emailValidation = useFieldValidation('email', formState.email, 'repartidor');
  const phoneValidation = useFieldValidation('phone', formState.phone, 'repartidor');

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

    if (emailValidation !== 'valid' || phoneValidation !== 'valid') {
      setError('Por favor, corrige los campos marcados antes de continuar.');
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
            role: 'repartidor',
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
      <section className="bg-[#fef2f9] py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 mb-4">
            Gana a tu ritmo. <br className="hidden md:block" />
            Sé el héroe de tu comunidad.
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Únete a nuestra flota de repartidores y disfruta de la libertad de elegir tus horarios, con ganancias justas y el respaldo de un equipo local.
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
                ¿Por qué repartir con Doña Repartos?
              </h2>
              <ul className="space-y-5 md:space-y-6">
                <li className="flex items-start">
                  <CheckCircleIcon />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-800 mb-1">
                      Ganancias Claras y Justas
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Te quedas con un alto porcentaje de la tarifa de envío y el 100% de tus propinas. Siempre.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-800 mb-1">
                      Flexibilidad Total
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Sin jefes ni horarios fijos. Conéctate cuando quieras, el tiempo que quieras. Tú tienes el control.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg text-gray-800 mb-1">
                      Soporte que te Respalda
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Somos un equipo. Tienes acceso a soporte local y humano para ayudarte en cada paso del camino.
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
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">¡Excelente! Estás un paso más cerca.</h3>
                  <p className="text-gray-600 mb-2">
                    Hemos enviado un correo a <strong className="text-gray-800">{formState.email}</strong>.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Por favor, revísalo para continuar con tu proceso de registro.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    ¡Únete hoy!
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
                        emailValidation !== 'valid' ||
                        phoneValidation !== 'valid' ||
                        !passwordStrength ||
                        passwordStrength === 'weak'
                      }
                      fullWidth
                    >
                      {isLoading ? 'Enviando solicitud...' : 'Iniciar Registro'}
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
