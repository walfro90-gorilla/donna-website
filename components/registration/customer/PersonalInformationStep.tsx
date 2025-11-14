// components/registration/customer/PersonalInformationStep.tsx
"use client";

import { useState, useEffect } from 'react';
import { StepProps } from '@/components/forms/StepperForm';
import FormField from '@/components/FormField';
import { useFieldValidation } from '@/lib/hooks/useFieldValidation';
import { Card, CardContent } from '@/components/ui';
import ErrorMessage from '@/components/ErrorMessage';

interface PersonalInformationData {
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  termsAccepted?: boolean;
}

export default function PersonalInformationStep({
  data,
  onDataChange,
  onNext,
  errors,
}: StepProps) {
  const [formData, setFormData] = useState<PersonalInformationData>({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    birthDate: data.birthDate || '',
    gender: data.gender || undefined,
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Real-time validation
  const emailValidation = useFieldValidation('email', formData.email, 'cliente');
  const phoneValidation = useFieldValidation('phone', formData.phone, 'cliente');

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear local error when user starts typing
    if (localErrors[id]) {
      setLocalErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (emailValidation === 'invalid') {
      newErrors.email = 'Este correo electrónico ya está en uso';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (phoneValidation === 'invalid') {
      newErrors.phone = 'Este teléfono ya está en uso';
    }

    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        newErrors.birthDate = 'Debes tener al menos 13 años para registrarte';
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm() && emailValidation === 'valid' && phoneValidation === 'valid') {
      onNext();
    }
  };

  const canProceed = formData.name.trim() && 
                    formData.email.trim() && 
                    formData.phone.trim() && 
                    emailValidation === 'valid' && 
                    phoneValidation === 'valid' &&
                    Object.keys(localErrors).length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Información Personal
        </h2>
        <p className="text-gray-600">
          Cuéntanos un poco sobre ti para personalizar tu experiencia
        </p>
      </div>

      {/* Form */}
      <Card variant="default">
        <CardContent className="p-6 space-y-6">
          {/* Name Field */}
          <FormField
            label="Nombre Completo"
            id="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Juan Pérez"
            error={localErrors.name || errors?.name}
            helpText="Usa tu nombre real para que los repartidores puedan identificarte"
          />

          {/* Email Field */}
          <FormField
            label="Correo Electrónico"
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="tu@email.com"
            validationStatus={emailValidation}
            validationMessage={
              emailValidation === 'valid'
                ? '¡Correo disponible!'
                : emailValidation === 'invalid'
                ? 'Este correo ya está en uso'
                : emailValidation === 'checking'
                ? 'Verificando disponibilidad...'
                : undefined
            }
            error={localErrors.email || errors?.email}
            helpText="Te enviaremos confirmaciones de pedidos y promociones"
          />

          {/* Phone Field */}
          <FormField
            label="Teléfono"
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="123-456-7890"
            validationStatus={phoneValidation}
            validationMessage={
              phoneValidation === 'valid'
                ? 'Teléfono disponible'
                : phoneValidation === 'invalid'
                ? 'Este teléfono ya está en uso'
                : phoneValidation === 'checking'
                ? 'Verificando disponibilidad...'
                : undefined
            }
            error={localErrors.phone || errors?.phone}
            helpText="Para contactarte sobre tu pedido si es necesario"
          />

          {/* Optional Fields */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información Adicional (Opcional)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta información nos ayuda a mejorar tu experiencia, pero puedes omitirla si prefieres.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Birth Date */}
              <FormField
                label="Fecha de Nacimiento"
                id="birthDate"
                type="date"
                value={formData.birthDate || ''}
                onChange={handleInputChange}
                error={localErrors.birthDate}
                helpText="Para ofertas especiales en tu cumpleaños"
              />

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Género
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] bg-white text-gray-900"
                >
                  <option value="">Seleccionar (opcional)</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                  <option value="prefer_not_to_say">Prefiero no decir</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Para personalizar recomendaciones
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Privacidad y Seguridad
                </h4>
                <p className="text-sm text-blue-800">
                  Tu información personal está protegida y solo se usa para mejorar tu experiencia de pedidos. 
                  Nunca compartimos tus datos con terceros sin tu consentimiento.
                </p>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errors?.general && <ErrorMessage message={errors.general} />}
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.termsAccepted || false}
              onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
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
          {(localErrors.termsAccepted || errors?.termsAccepted) && (
            <p className="text-red-600 text-sm mt-2">
              {localErrors.termsAccepted || errors?.termsAccepted}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!canProceed || !formData.termsAccepted}
          className="px-8 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}