// app/socios/page.tsx
"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Icono para la sección de beneficios
const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function SociosPage() {
  const [formState, setFormState] = useState({
    restaurantName: '',
    contactName: '',
    phone: '',
    email: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Paso 1: Verificación previa con la nueva función RPC
      const { data: checkData, error: checkError } = await supabase.rpc('pre_signup_check', {
        p_restaurant_name: formState.restaurantName,
        p_email: formState.email
      });

      if (checkError) throw checkError;

      if (checkData.name_taken) {
        throw new Error('Ya existe un restaurante registrado con este nombre.');
      }
      if (checkData.email_taken) {
        throw new Error('Este correo electrónico ya está en uso.');
      }

      // Paso 2: Si todo está libre, proceder con el registro
      const tempPassword = Math.random().toString(36).slice(-8);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formState.email,
        password: tempPassword,
        options: {
          data: {
            role: 'restaurante',
            name: formState.contactName,
            phone: formState.phone,
            restaurant_name: formState.restaurantName,
          }
        }
      });

      if (signUpError) throw signUpError;

      setIsSubmitted(true);

    } catch (error: any) {
      setError(error.message || 'Hubo un error al enviar tu solicitud. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-[#fef2f9] py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4">
            Haz crecer tu negocio. <br />
            Únete a la familia Doña Repartos.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Llega a miles de clientes hambrientos en tu comunidad y aumenta tus ventas con nuestras comisiones justas y tecnología fácil de usar.
          </p>
        </div>
      </section>

      {/* Sección de Beneficios y Formulario */}
      <section className="py-20">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Columna de Beneficios */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">¿Por qué asociarte con nosotros?</h2>
            <ul className="space-y-6">
              <li className="flex items-start"><CheckCircleIcon /><div><h3 className="font-semibold text-lg">Más Ventas, Menos Complicaciones</h3><p className="text-gray-600">Concéntrate en lo que amas, cocinar. Nosotros nos encargamos de la logística para llevar tus platillos a más personas.</p></div></li>
              <li className="flex items-start"><CheckCircleIcon /><div><h3 className="font-semibold text-lg">Comisiones Justas y Transparentes</h3><p className="text-gray-600">Creemos en el crecimiento mutuo. Nuestras comisiones están diseñadas para ser las más competitivas del mercado.</p></div></li>
              <li className="flex items-start"><CheckCircleIcon /><div><h3 className="font-semibold text-lg">Somos de Aquí, para los de Aquí</h3><p className="text-gray-600">A diferencia de las grandes corporaciones, entendemos el mercado local. Recibe soporte personalizado de un equipo que conoce tu ciudad.</p></div></li>
            </ul>
          </div>

          {/* Columna de Formulario */}
          <div className="bg-white p-8 rounded-lg shadow-2xl">
            {isSubmitted ? (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">¡Gracias por tu interés!</h3>
                <p className="text-gray-600">Hemos enviado un correo de confirmación a <strong>{formState.email}</strong>. Por favor, revisa tu bandeja de entrada para completar tu registro.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">¡Empieza hoy mismo!</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">Nombre del Restaurante</label>
                    <input type="text" id="restaurantName" value={formState.restaurantName} onChange={handleInputChange} required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]" />
                  </div>
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Nombre del Contacto</label>
                    <input type="text" id="contactName" value={formState.contactName} onChange={handleInputChange} required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input type="email" id="email" value={formState.email} onChange={handleInputChange} required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input type="tel" id="phone" value={formState.phone} onChange={handleInputChange} required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c]" />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-[#e4007c] text-white font-bold py-3 px-4 rounded-md hover:bg-[#c6006b] transition-colors disabled:bg-gray-400">
                    {isLoading ? 'Verificando...' : 'Enviar Solicitud'}
                  </button>
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

