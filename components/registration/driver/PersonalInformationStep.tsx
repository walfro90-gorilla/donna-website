// components/registration/driver/PersonalInformationStep.tsx
"use client";

import { useState, useEffect } from 'react';
import FormField from '@/components/FormField';
import ErrorMessage from '@/components/ErrorMessage';
import PasswordStrength from '@/components/PasswordStrength';
import { useFieldValidation } from '@/lib/hooks/useFieldValidation';
import { getPasswordStrength } from '@/lib/utils/validation';
import type { StepProps } from '@/components/forms/StepperForm';
import type { CompleteDeliveryDriverRegistration } from '@/types/form';

export interface PersonalInformationStepProps extends StepProps {
  data: CompleteDeliveryDriverRegistration;
  onDataChange: (data: Partial<CompleteDeliveryDriverRegistration>) => void;
}

export default function PersonalInformationStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading,
  errors,
}: PersonalInformationStepProps) {
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const emailValidation = useFieldValidation('email', data.personalInfo?.email || '', 'repartidor');
  const phoneValidation = useFieldValidation('phone', data.personalInfo?.phone || '', 'repartidor');

  useEffect(() => {
    if (data.personalInfo?.password) {
      setPasswordStrength(getPasswordStrength(data.personalInfo.password));
    } else {
      setPasswordStrength(null);
    }
  }, [data.personalInfo?.password]);

  const handleInputChange = (field: string, value: string) => {
    onDataChange({ 
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    });
    
    // Clear local error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedInputChange = (section: 'emergencyContact' | 'address', field: string, value: string) => {
    onDataChange({
      personalInfo: {
        ...data.personalInfo,
        [section]: {
          ...data.personalInfo?.[section],
          [field]: value
        }
      }
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!data.personalInfo?.firstName?.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!data.personalInfo?.lastName?.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!data.personalInfo?.email?.trim()) newErrors.email = 'El correo electrónico es requerido';
    if (!data.personalInfo?.phone?.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!data.personalInfo?.password?.trim()) newErrors.password = 'La contraseña es requerida';
    if (!data.personalInfo?.dateOfBirth?.trim()) newErrors.dateOfBirth = 'La fecha de nacimiento es requerida';
    if (!data.personalInfo?.nationalId?.trim()) newErrors.nationalId = 'La identificación nacional es requerida';

    // Emergency contact validation
    if (!data.personalInfo?.emergencyContact?.name?.trim()) newErrors.emergencyContactName = 'El nombre del contacto de emergencia es requerido';
    if (!data.personalInfo?.emergencyContact?.relationship?.trim()) newErrors.emergencyContactRelationship = 'La relación del contacto de emergencia es requerida';
    if (!data.personalInfo?.emergencyContact?.phone?.trim()) newErrors.emergencyContactPhone = 'El teléfono del contacto de emergencia es requerido';

    // Address validation
    if (!data.personalInfo?.address?.street?.trim()) newErrors.addressStreet = 'La calle es requerida';
    if (!data.personalInfo?.address?.number?.trim()) newErrors.addressNumber = 'El número es requerido';
    if (!data.personalInfo?.address?.neighborhood?.trim()) newErrors.addressNeighborhood = 'La colonia es requerida';
    if (!data.personalInfo?.address?.city?.trim()) newErrors.addressCity = 'La ciudad es requerida';
    if (!data.personalInfo?.address?.state?.trim()) newErrors.addressState = 'El estado es requerido';
    if (!data.personalInfo?.address?.postalCode?.trim()) newErrors.addressPostalCode = 'El código postal es requerido';

    // Email and phone validation
    if (emailValidation === 'invalid') newErrors.email = 'Este correo electrónico ya está en uso';
    if (phoneValidation === 'invalid') newErrors.phone = 'Este teléfono ya está en uso';

    // Password strength validation
    if (data.personalInfo?.password && (!passwordStrength || passwordStrength === 'weak')) {
      newErrors.password = 'La contraseña debe ser más segura';
    }

    // Age validation (must be 18+)
    if (data.personalInfo?.dateOfBirth) {
      const birthDate = new Date(data.personalInfo.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors.dateOfBirth = 'Debes ser mayor de 18 años para registrarte';
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

  const allErrors = { ...localErrors, ...errors };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Personal
        </h3>
        <p className="text-gray-600 mb-6">
          Proporciona tu información personal básica. Toda la información será verificada durante el proceso de aprobación.
        </p>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Nombre(s)"
          id="firstName"
          type="text"
          value={data.personalInfo?.firstName || ''}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          required
          placeholder="Juan"
          error={allErrors.firstName}
        />

        <FormField
          label="Apellido(s)"
          id="lastName"
          type="text"
          value={data.personalInfo?.lastName || ''}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          required
          placeholder="Pérez García"
          error={allErrors.lastName}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Correo Electrónico"
          id="email"
          type="email"
          value={data.personalInfo?.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
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
          error={allErrors.email}
        />

        <FormField
          label="Teléfono"
          id="phone"
          type="tel"
          value={data.personalInfo?.phone || ''}
          onChange={(e) => handleInputChange('phone', e.target.value)}
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
          error={allErrors.phone}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Fecha de Nacimiento"
          id="dateOfBirth"
          type="date"
          value={data.personalInfo?.dateOfBirth || ''}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          required
          error={allErrors.dateOfBirth}
          helpText="Debes ser mayor de 18 años"
        />

        <FormField
          label="Identificación Nacional (CURP/INE)"
          id="nationalId"
          type="text"
          value={data.personalInfo?.nationalId || ''}
          onChange={(e) => handleInputChange('nationalId', e.target.value)}
          required
          placeholder="CURP o número de INE"
          error={allErrors.nationalId}
        />
      </div>

      <div>
        <FormField
          label="Contraseña"
          id="password"
          type="password"
          value={data.personalInfo?.password || ''}
          onChange={(e) => handleInputChange('password', e.target.value)}
          required
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          helpText="Debe contener mayúsculas, minúsculas y números"
          error={allErrors.password}
        />
        <PasswordStrength password={data.personalInfo?.password || ''} />
      </div>

      {/* Emergency Contact */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Contacto de Emergencia
        </h4>
        <p className="text-gray-600 mb-4 text-sm">
          Esta información será utilizada únicamente en caso de emergencia durante tus entregas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Nombre Completo"
            id="emergencyContactName"
            type="text"
            value={data.personalInfo?.emergencyContact?.name || ''}
            onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
            required
            placeholder="María Pérez"
            error={allErrors.emergencyContactName}
          />

          <FormField
            label="Relación"
            id="emergencyContactRelationship"
            type="text"
            value={data.personalInfo?.emergencyContact?.relationship || ''}
            onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
            required
            placeholder="Madre, Esposa, Hermano, etc."
            error={allErrors.emergencyContactRelationship}
          />

          <FormField
            label="Teléfono"
            id="emergencyContactPhone"
            type="tel"
            value={data.personalInfo?.emergencyContact?.phone || ''}
            onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
            required
            placeholder="123-456-7890"
            error={allErrors.emergencyContactPhone}
          />
        </div>
      </div>

      {/* Address */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Dirección de Residencia
        </h4>
        <p className="text-gray-600 mb-4 text-sm">
          Proporciona tu dirección actual de residencia para verificación.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormField
            label="Calle"
            id="addressStreet"
            type="text"
            value={data.personalInfo?.address?.street || ''}
            onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
            required
            placeholder="Av. Insurgentes"
            error={allErrors.addressStreet}
          />

          <FormField
            label="Número"
            id="addressNumber"
            type="text"
            value={data.personalInfo?.address?.number || ''}
            onChange={(e) => handleNestedInputChange('address', 'number', e.target.value)}
            required
            placeholder="123"
            error={allErrors.addressNumber}
          />

          <FormField
            label="Colonia"
            id="addressNeighborhood"
            type="text"
            value={data.personalInfo?.address?.neighborhood || ''}
            onChange={(e) => handleNestedInputChange('address', 'neighborhood', e.target.value)}
            required
            placeholder="Roma Norte"
            error={allErrors.addressNeighborhood}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Ciudad"
            id="addressCity"
            type="text"
            value={data.personalInfo?.address?.city || ''}
            onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
            required
            placeholder="Ciudad de México"
            error={allErrors.addressCity}
          />

          <FormField
            label="Estado"
            id="addressState"
            type="text"
            value={data.personalInfo?.address?.state || ''}
            onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
            required
            placeholder="CDMX"
            error={allErrors.addressState}
          />

          <FormField
            label="Código Postal"
            id="addressPostalCode"
            type="text"
            value={data.personalInfo?.address?.postalCode || ''}
            onChange={(e) => handleNestedInputChange('address', 'postalCode', e.target.value)}
            required
            placeholder="06700"
            error={allErrors.addressPostalCode}
          />
        </div>

        <input
          type="hidden"
          value={data.personalInfo?.address?.country || 'México'}
          onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
        />
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.personalInfo?.termsAccepted || false}
            onChange={(e) => handleInputChange('termsAccepted', e.target.checked ? 'true' : 'false')}
            className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            Acepto los{' '}
            <a 
              href="/legal/terminos-repartidores" 
              target="_blank"
              className="text-[#e4007c] hover:text-[#c6006b] underline font-medium"
            >
              Términos y Condiciones para Repartidores
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
        {allErrors.termsAccepted && (
          <p className="text-red-600 text-sm mt-2">{allErrors.termsAccepted}</p>
        )}
      </div>

      {/* Error Messages */}
      {Object.keys(allErrors).length > 0 && (
        <ErrorMessage message="Por favor, corrige los campos marcados antes de continuar." />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          disabled={isLoading}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <button
          onClick={handleNext}
          disabled={
            isLoading ||
            emailValidation !== 'valid' ||
            phoneValidation !== 'valid' ||
            !passwordStrength ||
            passwordStrength === 'weak' ||
            !data.personalInfo?.termsAccepted
          }
          className="px-6 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Validando...' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}