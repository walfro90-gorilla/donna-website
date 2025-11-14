// components/registration/driver/VehicleInformationStep.tsx
"use client";

import { useState } from 'react';
import FormField from '@/components/FormField';
import ErrorMessage from '@/components/ErrorMessage';
import { Card, CardContent } from '@/components/ui';
import type { StepProps } from '@/components/forms/StepperForm';
import type { CompleteDeliveryDriverRegistration } from '@/types/form';

export interface VehicleInformationStepProps extends StepProps {
  data: CompleteDeliveryDriverRegistration;
  onDataChange: (data: Partial<CompleteDeliveryDriverRegistration>) => void;
}

const vehicleTypeOptions = [
  { value: 'bicycle', label: 'Bicicleta', icon: '🚲', description: 'Ideal para distancias cortas y zonas urbanas' },
  { value: 'motorcycle', label: 'Motocicleta', icon: '🏍️', description: 'Rápida y eficiente para entregas urbanas' },
  { value: 'scooter', label: 'Scooter', icon: '🛵', description: 'Económica y fácil de manejar' },
  { value: 'car', label: 'Automóvil', icon: '🚗', description: 'Para entregas grandes y largas distancias' },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function VehicleInformationStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading,
  errors,
}: VehicleInformationStepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number | boolean) => {
    onDataChange({ 
      vehicleInfo: {
        ...data.vehicleInfo,
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

  const handleVehicleTypeSelect = (vehicleType: 'bicycle' | 'motorcycle' | 'car' | 'scooter') => {
    onDataChange({ 
      vehicleInfo: {
        ...data.vehicleInfo,
        vehicleType
      }
    });
    
    // Clear vehicle-specific errors when changing type
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.vehicleType;
      delete newErrors.licensePlate;
      delete newErrors.vehicleRegistrationNumber;
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!data.vehicleInfo?.vehicleType) newErrors.vehicleType = 'Selecciona el tipo de vehículo';
    if (!data.vehicleInfo?.vehicleBrand?.trim()) newErrors.vehicleBrand = 'La marca del vehículo es requerida';
    if (!data.vehicleInfo?.vehicleModel?.trim()) newErrors.vehicleModel = 'El modelo del vehículo es requerido';
    if (!data.vehicleInfo?.vehicleYear) newErrors.vehicleYear = 'El año del vehículo es requerido';
    if (!data.vehicleInfo?.vehicleColor?.trim()) newErrors.vehicleColor = 'El color del vehículo es requerido';

    // Vehicle-specific validations
    if (data.vehicleInfo?.vehicleType !== 'bicycle') {
      if (!data.vehicleInfo?.licensePlate?.trim()) {
        newErrors.licensePlate = 'Las placas del vehículo son requeridas';
      }
      if (!data.vehicleInfo?.vehicleRegistrationNumber?.trim()) {
        newErrors.vehicleRegistrationNumber = 'El número de registro del vehículo es requerido';
      }
    }

    // Insurance validation for motorized vehicles
    if (data.vehicleInfo?.vehicleType === 'motorcycle' || data.vehicleInfo?.vehicleType === 'car' || data.vehicleInfo?.vehicleType === 'scooter') {
      if (!data.vehicleInfo?.hasInsurance) {
        newErrors.hasInsurance = 'El seguro es obligatorio para vehículos motorizados';
      } else {
        if (!data.vehicleInfo?.insuranceProvider?.trim()) {
          newErrors.insuranceProvider = 'La aseguradora es requerida';
        }
        if (!data.vehicleInfo?.insurancePolicyNumber?.trim()) {
          newErrors.insurancePolicyNumber = 'El número de póliza es requerido';
        }
        if (!data.vehicleInfo?.insuranceExpiryDate?.trim()) {
          newErrors.insuranceExpiryDate = 'La fecha de vencimiento del seguro es requerida';
        } else {
          // Validate that insurance is not expired
          const expiryDate = new Date(data.vehicleInfo.insuranceExpiryDate);
          const today = new Date();
          if (expiryDate <= today) {
            newErrors.insuranceExpiryDate = 'El seguro debe estar vigente';
          }
        }
      }
    }

    // Year validation
    if (data.vehicleInfo?.vehicleYear && (data.vehicleInfo.vehicleYear < 1990 || data.vehicleInfo.vehicleYear > currentYear)) {
      newErrors.vehicleYear = `El año debe estar entre 1990 y ${currentYear}`;
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const allErrors = { ...localErrors, ...errors };
  const requiresInsurance = data.vehicleInfo?.vehicleType === 'motorcycle' || data.vehicleInfo?.vehicleType === 'car' || data.vehicleInfo?.vehicleType === 'scooter';
  const requiresPlates = data.vehicleInfo?.vehicleType !== 'bicycle';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información del Vehículo
        </h3>
        <p className="text-gray-600 mb-6">
          Proporciona los detalles de tu vehículo de reparto. Esta información será verificada con los documentos que subas más adelante.
        </p>
      </div>

      {/* Vehicle Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Vehículo *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleTypeOptions.map((option) => (
            <Card
              key={option.value}
              variant={data.vehicleInfo?.vehicleType === option.value ? 'primary' : 'outline'}
              className={`cursor-pointer transition-all hover:shadow-md ${
                data.vehicleInfo?.vehicleType === option.value ? 'ring-2 ring-[#e4007c]' : ''
              }`}
              onClick={() => handleVehicleTypeSelect(option.value as any)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{option.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-1">{option.label}</h4>
                <p className="text-sm text-gray-600">{option.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {allErrors.vehicleType && (
          <p className="mt-1 text-sm text-red-600">{allErrors.vehicleType}</p>
        )}
      </div>

      {/* Vehicle Details */}
      {data.vehicleInfo?.vehicleType && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Marca"
              id="vehicleBrand"
              type="text"
              value={data.vehicleInfo?.vehicleBrand || ''}
              onChange={(e) => handleInputChange('vehicleBrand', e.target.value)}
              required
              placeholder="Honda, Yamaha, Trek, etc."
              error={allErrors.vehicleBrand}
            />

            <FormField
              label="Modelo"
              id="vehicleModel"
              type="text"
              value={data.vehicleInfo?.vehicleModel || ''}
              onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
              required
              placeholder="CBR, FZ, Mountain Bike, etc."
              error={allErrors.vehicleModel}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año *
              </label>
              <select
                value={data.vehicleInfo?.vehicleYear || ''}
                onChange={(e) => handleInputChange('vehicleYear', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4007c] focus:border-transparent"
                required
              >
                <option value="">Selecciona el año</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {allErrors.vehicleYear && (
                <p className="mt-1 text-sm text-red-600">{allErrors.vehicleYear}</p>
              )}
            </div>

            <FormField
              label="Color"
              id="vehicleColor"
              type="text"
              value={data.vehicleInfo?.vehicleColor || ''}
              onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
              required
              placeholder="Rojo, Azul, Negro, etc."
              error={allErrors.vehicleColor}
            />
          </div>

          {/* License Plate and Registration (not for bicycles) */}
          {requiresPlates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Placas"
                id="licensePlate"
                type="text"
                value={data.vehicleInfo?.licensePlate || ''}
                onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                required
                placeholder="ABC-123-D"
                error={allErrors.licensePlate}
                helpText="Formato: ABC-123-D"
              />

              <FormField
                label="Número de Registro Vehicular"
                id="vehicleRegistrationNumber"
                type="text"
                value={data.vehicleInfo?.vehicleRegistrationNumber || ''}
                onChange={(e) => handleInputChange('vehicleRegistrationNumber', e.target.value)}
                required
                placeholder="Número de tarjeta de circulación"
                error={allErrors.vehicleRegistrationNumber}
              />
            </div>
          )}
        </div>
      )}

      {/* Insurance Information (for motorized vehicles) */}
      {requiresInsurance && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Información del Seguro
          </h4>
          <p className="text-gray-600 mb-4 text-sm">
            El seguro es obligatorio para todos los vehículos motorizados. Debes mantener tu seguro vigente durante todo el tiempo que trabajes con nosotros.
          </p>

          <div className="mb-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={data.vehicleInfo?.hasInsurance || false}
                onChange={(e) => handleInputChange('hasInsurance', e.target.checked)}
                className="w-4 h-4 text-[#e4007c] border-gray-300 rounded focus:ring-[#e4007c]"
              />
              <span className="text-sm font-medium text-gray-700">
                Mi vehículo cuenta con seguro vigente *
              </span>
            </label>
            {allErrors.hasInsurance && (
              <p className="mt-1 text-sm text-red-600">{allErrors.hasInsurance}</p>
            )}
          </div>

          {data.vehicleInfo?.hasInsurance && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Aseguradora"
                  id="insuranceProvider"
                  type="text"
                  value={data.vehicleInfo?.insuranceProvider || ''}
                  onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                  required
                  placeholder="BBVA Seguros, GNP, Qualitas, etc."
                  error={allErrors.insuranceProvider}
                />

                <FormField
                  label="Número de Póliza"
                  id="insurancePolicyNumber"
                  type="text"
                  value={data.vehicleInfo?.insurancePolicyNumber || ''}
                  onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                  required
                  placeholder="Número de póliza de seguro"
                  error={allErrors.insurancePolicyNumber}
                />
              </div>

              <FormField
                label="Fecha de Vencimiento del Seguro"
                id="insuranceExpiryDate"
                type="date"
                value={data.vehicleInfo?.insuranceExpiryDate || ''}
                onChange={(e) => handleInputChange('insuranceExpiryDate', e.target.value)}
                required
                error={allErrors.insuranceExpiryDate}
                helpText="El seguro debe estar vigente"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Información Importante</h5>
            <p className="text-sm text-blue-800">
              Toda la información proporcionada será verificada con los documentos que subas en el siguiente paso. 
              Asegúrate de que los datos coincidan exactamente con tus documentos oficiales.
            </p>
          </div>
        </div>
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
          disabled={isLoading || !data.vehicleInfo?.vehicleType}
          className="px-6 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Validando...' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}