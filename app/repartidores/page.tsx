// app/repartidores/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';

// Icono para la sección de beneficios
const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// Tipos para el estado de validación
type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export default function RepartidoresPage() {
  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    email: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Nuevo estado para la validación del email
  const [emailValidation, setEmailValidation] = useState<ValidationStatus>('idle');

  // Memoizar el cliente Supabase para que no cambie la referencia en cada render
  const supabase = useSupabase();
  
  // useEffect para validar el email con "debouncing"
  useEffect(() => {
    // Si el email está vacío o no es un email válido, reseteamos el estado
    if (!formState.email || !/^\S+@\S+\.\S+$/.test(formState.email)) {
      setEmailValidation('idle');
      return;
    }

    // Empezamos a verificar (estado intermedio)
    setEmailValidation('checking');

    // "Debounce": esperamos 500ms después de que el usuario deja de teclear
    let cancelled = false;
    // token para identificar la petición actual y evitar que respuestas antiguas
    const requestToken = Symbol();
    let currentToken = requestToken;

    const debounceTimer = setTimeout(() => {
      (async () => {
        try {
          const { data, error } = await supabase.rpc('pre_signup_check_repartidor', {
            p_email: formState.email
          });

          if (cancelled || currentToken !== requestToken) return; // si se limpió el efecto o token cambió, ignorar

          if (error) {
            console.error('Error al validar email:', error);
            setEmailValidation('invalid');
            return;
          }

          // Actualizamos el estado de validación según la respuesta
          if (data?.email_taken) {
            setEmailValidation('invalid');
          } else {
            setEmailValidation('valid');
          }

        } catch (e) {
          if (cancelled || currentToken !== requestToken) return;
          // En caso de error en la llamada, lo dejamos como 'invalid' para bloquear el envío
          setEmailValidation('invalid');
          console.error("Error al validar email:", e);
        }
      })();
    }, 500);

    // Limpiamos el timer si el usuario sigue tecleando
    return () => { cancelled = true; clearTimeout(debounceTimer); };

  }, [formState.email, supabase]);


  // Nuevo estado y useEffect para validar el teléfono con la misma lógica
  const [phoneValidation, setPhoneValidation] = useState<ValidationStatus>('idle');

  useEffect(() => {
    // Si el teléfono está vacío o no tiene un formato razonable, reseteamos
    if (!formState.phone || !/^[0-9()+\-\s]{7,20}$/.test(formState.phone)) {
      setPhoneValidation('idle');
      return;
    }

    setPhoneValidation('checking');

    let cancelled = false;
    const debounceTimer = setTimeout(() => {
      (async () => {
        try {
          // Intentamos validar el teléfono contra la tabla client_profiles
          const { data, error } = await supabase
            .from('client_profiles')
            .select('user_id') // Usamos user_id en lugar de id
            .eq('phone', formState.phone)
            .limit(1);

          if (cancelled) return;

          // Si hay un error porque la tabla/columna no existe, dejamos pasar la validación
          if (error) {
            if (error.code === 'PGRST205' || error.code === '42703') {
              console.warn('Validación de teléfono no disponible:', error);
              setPhoneValidation('valid'); // permitimos continuar si no podemos validar
              return;
            }
            // Otro tipo de error: marcamos como válido pero logueamos
            console.error('Error al validar teléfono:', error);
            setPhoneValidation('valid');
            return;
          }

          // Si encontramos el teléfono, está en uso
          if (data && data.length > 0) {
            setPhoneValidation('invalid');
          } else {
            setPhoneValidation('valid');
          }

        } catch (e) {
          if (cancelled) return;
          setPhoneValidation('invalid');
          console.error('Error al validar teléfono:', e);
        }
      })();
    }, 500);

    return () => { cancelled = true; clearTimeout(debounceTimer); };
  }, [formState.phone, supabase]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // No permitir enviar si el email es inválido
    if (emailValidation !== 'valid') {
        setError('Por favor, usa un correo electrónico válido y disponible.');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Ya no necesitamos la validación aquí porque se hizo en tiempo real
      const tempPassword = Math.random().toString(36).slice(-8);

      const { error: signUpError } = await supabase.auth.signUp({
        email: formState.email,
        password: tempPassword,
        options: {
          data: {
            role: 'repartidor',
            name: formState.name,
            phone: formState.phone,
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

  // Función para obtener las clases del borde del input de email
  const getEmailInputClasses = () => {
    const baseClasses = "mt-1 block w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors text-gray-800";
    switch (emailValidation) {
        case 'valid':
            return `${baseClasses} border-green-500 ring-green-500`;
        case 'invalid':
            return `${baseClasses} border-red-500 ring-red-500`;
        default:
            return `${baseClasses} border-gray-300 focus:ring-[#e4007c] focus:border-[#e4007c]`;
    }
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-[#fef2f9] py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4">
            Gana a tu ritmo. <br />
            Sé el héroe de tu comunidad.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Únete a nuestra flota de repartidores y disfruta de la libertad de elegir tus horarios, con ganancias justas y el respaldo de un equipo local.
          </p>
        </div>
      </section>

      {/* Sección de Beneficios y Formulario */}
      <section className="py-20">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Columna de Beneficios */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">¿Por qué repartir con Doña Repartos?</h2>
            <ul className="space-y-6">
              <li className="flex items-start"><CheckCircleIcon /><div><h3 className="font-semibold text-lg text-gray-800">Ganancias Claras y Justas</h3><p className="text-gray-600">Te quedas con un alto porcentaje de la tarifa de envío y el 100% de tus propinas. Siempre.</p></div></li>
              <li className="flex items-start"><CheckCircleIcon /><div><h3 className="font-semibold text-lg text-gray-800">Flexibilidad Total</h3><p className="text-gray-600">Sin jefes ni horarios fijos. Conéctate cuando quieras, el tiempo que quieras. Tú tienes el control.</p></div></li>
              <li className="flex items-start"><CheckCircleIcon /><div><h3 className="font-semibold text-lg text-gray-800">Soporte que te Respalda</h3><p className="text-gray-600">Somos un equipo. Tienes acceso a soporte local y humano para ayudarte en cada paso del camino.</p></div></li>
            </ul>
          </div>

          {/* Columna de Formulario */}
          <div className="bg-white p-8 rounded-lg shadow-2xl">
            {isSubmitted ? (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">¡Excelente! Estás un paso más cerca.</h3>
                <p className="text-gray-600">Hemos enviado un correo a <strong>{formState.email}</strong>. Por favor, revísalo para continuar con tu proceso de registro.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">¡Únete hoy!</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input type="text" id="name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] text-gray-800" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input aria-describedby="email-help" type="email" id="email" value={formState.email} onChange={handleInputChange} required className={getEmailInputClasses()} />
                    {/* Mensaje de validación - usamos un solo elemento para evitar swapping/parpadeo */}
                    <p id="email-help" className={`text-xs mt-1 min-h-[1rem] ${emailValidation === 'checking' ? 'text-gray-500' : emailValidation === 'valid' ? 'text-green-600' : emailValidation === 'invalid' ? 'text-red-600' : 'text-transparent'}`}>
                      {emailValidation === 'checking' && 'Verificando...'}
                      {emailValidation === 'valid' && '¡Correo disponible!'}
                      {emailValidation === 'invalid' && formState.email && 'Este correo ya está en uso.'}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input aria-describedby="phone-help" type="tel" id="phone" value={formState.phone} onChange={handleInputChange} required className={`mt-1 block w-full px-4 py-3 border ${phoneValidation === 'valid' ? 'border-green-500' : phoneValidation === 'invalid' ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] bg-white text-gray-900 placeholder-gray-400`} />
                    <p id="phone-help" className={`text-xs mt-1 min-h-[1rem] ${phoneValidation === 'checking' ? 'text-gray-500' : phoneValidation === 'valid' ? 'text-green-600' : phoneValidation === 'invalid' ? 'text-red-600' : 'text-transparent'}`}>
                      {phoneValidation === 'checking' && 'Verificando...'}
                      {phoneValidation === 'valid' && 'Teléfono disponible'}
                      {phoneValidation === 'invalid' && formState.phone && 'Este teléfono ya está en uso.'}
                    </p>
                  </div>
                  <button type="submit" disabled={isLoading || emailValidation !== 'valid'} className="w-full bg-[#e4007c] text-white font-bold py-3 px-4 rounded-md hover:bg-[#c6006b] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Enviando...' : 'Iniciar Registro'}
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

