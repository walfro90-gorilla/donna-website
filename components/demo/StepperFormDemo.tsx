// components/demo/StepperFormDemo.tsx
"use client";

import { useState } from 'react';
import { StepperForm, RegistrationStep, StepProps } from '@/components/forms';
import { Card, CardContent, Alert } from '@/components/ui';
import FormField from '@/components/FormField';
import FormButton from '@/components/FormButton';

// Demo Step 1: Personal Information
function PersonalInfoStep({ data, onDataChange, onNext, onPrevious, errors }: StepProps) {
  const [localData, setLocalData] = useState({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onDataChange(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Nombre Completo"
          id="name"
          type="text"
          value={localData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          placeholder="Juan Pérez"
          error={errors?.name}
        />

        <FormField
          label="Correo Electrónico"
          id="email"
          type="email"
          value={localData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          placeholder="juan@ejemplo.com"
          error={errors?.email}
        />
      </div>

      <FormField
        label="Teléfono"
        id="phone"
        type="tel"
        value={localData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        required
        placeholder="+52 123 456 7890"
        error={errors?.phone}
      />

      {errors?.general && (
        <Alert variant="error">
          {errors.general}
        </Alert>
      )}
    </form>
  );
}

// Demo Step 2: Business Information
function BusinessInfoStep({ data, onDataChange, onNext, onPrevious, errors }: StepProps) {
  const [localData, setLocalData] = useState({
    businessName: data.businessName || '',
    businessType: data.businessType || '',
    description: data.description || '',
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onDataChange(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Nombre del Negocio"
        id="businessName"
        type="text"
        value={localData.businessName}
        onChange={(e) => handleChange('businessName', e.target.value)}
        required
        placeholder="Mi Restaurante"
        error={errors?.businessName}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Negocio *
          </label>
          <select
            id="businessType"
            value={localData.businessType}
            onChange={(e) => handleChange('businessType', e.target.value)}
            required
            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] bg-white text-gray-900"
          >
            <option value="">Selecciona un tipo</option>
            <option value="restaurant">Restaurante</option>
            <option value="cafe">Café</option>
            <option value="bakery">Panadería</option>
            <option value="fastfood">Comida Rápida</option>
            <option value="other">Otro</option>
          </select>
          {errors?.businessType && (
            <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción (Opcional)
        </label>
        <textarea
          id="description"
          value={localData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          placeholder="Describe tu negocio..."
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#e4007c] focus:border-[#e4007c] bg-white text-gray-900"
        />
      </div>

      {errors?.general && (
        <Alert variant="error">
          {errors.general}
        </Alert>
      )}
    </form>
  );
}

// Demo Step 3: Review and Confirm
function ReviewStep({ data, onDataChange, onNext, onPrevious, errors }: StepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Revisa tu información
        </h3>
        <p className="text-gray-600 mb-6">
          Por favor, verifica que toda la información sea correcta antes de continuar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="outlined">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Información Personal</h4>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Nombre:</dt>
                <dd className="text-gray-900">{data.name || 'No especificado'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email:</dt>
                <dd className="text-gray-900">{data.email || 'No especificado'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Teléfono:</dt>
                <dd className="text-gray-900">{data.phone || 'No especificado'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Información del Negocio</h4>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Nombre del Negocio:</dt>
                <dd className="text-gray-900">{data.businessName || 'No especificado'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo:</dt>
                <dd className="text-gray-900">{data.businessType || 'No especificado'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Descripción:</dt>
                <dd className="text-gray-900">{data.description || 'No especificada'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {errors?.general && (
        <Alert variant="error">
          {errors.general}
        </Alert>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Términos y Condiciones
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Al continuar, aceptas nuestros términos de servicio y política de privacidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StepperFormDemo() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedData, setCompletedData] = useState<any>(null);

  const steps: RegistrationStep[] = [
    {
      id: 'personal-info',
      title: 'Información Personal',
      description: 'Proporciona tu información básica',
      component: PersonalInfoStep,
      validation: async (data) => {
        const errors: Record<string, string> = {};
        
        if (!data.name?.trim()) {
          errors.name = 'El nombre es requerido';
        }
        
        if (!data.email?.trim()) {
          errors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
          errors.email = 'El email no es válido';
        }
        
        if (!data.phone?.trim()) {
          errors.phone = 'El teléfono es requerido';
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
    {
      id: 'business-info',
      title: 'Información del Negocio',
      description: 'Detalles sobre tu restaurante',
      component: BusinessInfoStep,
      validation: async (data) => {
        const errors: Record<string, string> = {};
        
        if (!data.businessName?.trim()) {
          errors.businessName = 'El nombre del negocio es requerido';
        }
        
        if (!data.businessType?.trim()) {
          errors.businessType = 'El tipo de negocio es requerido';
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
    {
      id: 'review',
      title: 'Revisar y Confirmar',
      description: 'Verifica tu información antes de enviar',
      component: ReviewStep,
      validation: async () => ({ isValid: true }),
    },
  ];

  const handleComplete = async (data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCompletedData(data);
    setIsCompleted(true);
  };

  const handleReset = () => {
    setIsCompleted(false);
    setCompletedData(null);
  };

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card variant="elevated">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Registro Completado!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Tu información ha sido enviada exitosamente. Te contactaremos pronto.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Datos enviados:</h3>
              <pre className="text-sm text-gray-600 overflow-auto">
                {JSON.stringify(completedData, null, 2)}
              </pre>
            </div>
            
            <FormButton onClick={handleReset} variant="primary">
              Probar de Nuevo
            </FormButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Demo: Formulario Multi-Paso
          </h1>
          <p className="text-gray-600">
            Ejemplo de registro de restaurante usando el nuevo sistema de pasos
          </p>
        </div>

        <StepperForm
          steps={steps}
          onComplete={handleComplete}
          persistKey="demo-registration"
          allowSkipOptional={true}
        />
      </div>
    </div>
  );
}