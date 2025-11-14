// components/registration/driver/BackgroundCheckStep.tsx
"use client";

import { useState } from 'react';
import ErrorMessage from '@/components/ErrorMessage';
import { Card, CardContent } from '@/components/ui';
import type { StepProps } from '@/components/forms/StepperForm';
import type { CompleteDeliveryDriverRegistration, BackgroundCheckStatus } from '@/types/form';

export interface BackgroundCheckStepProps extends StepProps {
  data: CompleteDeliveryDriverRegistration;
  onDataChange: (data: Partial<CompleteDeliveryDriverRegistration>) => void;
}

const backgroundCheckSteps = [
  {
    title: 'Verificación de Identidad',
    description: 'Confirmamos que tu identidad coincida con los documentos proporcionados',
    icon: '🆔',
    duration: '1-2 días hábiles'
  },
  {
    title: 'Antecedentes Penales',
    description: 'Revisión de antecedentes criminales a nivel nacional',
    icon: '🔍',
    duration: '3-5 días hábiles'
  },
  {
    title: 'Historial de Conducir',
    description: 'Verificación de tu historial de manejo y infracciones',
    icon: '🚗',
    duration: '2-3 días hábiles'
  },
  {
    title: 'Verificación Final',
    description: 'Revisión final y aprobación de tu aplicación',
    icon: '✅',
    duration: '1-2 días hábiles'
  }
];

const consentItems = [
  {
    id: 'identity_verification',
    title: 'Verificación de Identidad',
    description: 'Autorizo la verificación de mi identidad usando los documentos proporcionados y bases de datos oficiales.',
    required: true
  },
  {
    id: 'criminal_background',
    title: 'Antecedentes Penales',
    description: 'Autorizo la consulta de mis antecedentes penales en las bases de datos nacionales y locales.',
    required: true
  },
  {
    id: 'driving_record',
    title: 'Historial de Conducir',
    description: 'Autorizo la consulta de mi historial de manejo, infracciones y estado de mi licencia de conducir.',
    required: true
  },
  {
    id: 'employment_verification',
    title: 'Verificación Laboral',
    description: 'Autorizo la verificación de mi historial laboral y referencias proporcionadas.',
    required: false
  },
  {
    id: 'continuous_monitoring',
    title: 'Monitoreo Continuo',
    description: 'Autorizo el monitoreo continuo de mis antecedentes mientras sea repartidor activo.',
    required: true
  }
];

export default function BackgroundCheckStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading,
  errors,
}: BackgroundCheckStepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [consentGiven, setConsentGiven] = useState<Record<string, boolean>>({});
  const [isInitiating, setIsInitiating] = useState(false);

  const handleConsentChange = (itemId: string, checked: boolean) => {
    setConsentGiven(prev => ({
      ...prev,
      [itemId]: checked
    }));

    // Clear error when user gives consent
    if (checked && localErrors[itemId]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[itemId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required consents
    const requiredConsents = consentItems.filter(item => item.required);
    
    for (const item of requiredConsents) {
      if (!consentGiven[item.id]) {
        newErrors[item.id] = `Debes autorizar ${item.title.toLowerCase()} para continuar`;
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const initiateBackgroundCheck = async () => {
    if (!validateForm()) return;

    setIsInitiating(true);
    
    try {
      // Simulate background check initiation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const backgroundCheckId = `bg_${Date.now()}`;
      const estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + 7); // 7 days from now

      onDataChange({
        backgroundCheck: {
          ...data.backgroundCheck,
          consentGiven: true,
          backgroundCheckStatus: 'in_progress',
          backgroundCheckId,
          estimatedCompletionDate: estimatedCompletionDate.toISOString(),
        }
      });

      // Proceed to next step or completion
      onNext();
      
    } catch (error) {
      console.error('Error initiating background check:', error);
      setLocalErrors({
        general: 'Error al iniciar la verificación de antecedentes. Inténtalo de nuevo.'
      });
    } finally {
      setIsInitiating(false);
    }
  };

  const handleNext = () => {
    if (data.backgroundCheck.backgroundCheckStatus === 'in_progress' || data.backgroundCheck.backgroundCheckStatus === 'completed') {
      onNext();
    } else {
      initiateBackgroundCheck();
    }
  };

  const allErrors = { ...localErrors, ...errors };
  const requiredConsents = consentItems.filter(item => item.required);
  const givenRequiredConsents = requiredConsents.filter(item => consentGiven[item.id]);
  const canProceed = givenRequiredConsents.length === requiredConsents.length;

  // If background check is already in progress or completed, show status
  if (data.backgroundCheck.backgroundCheckStatus === 'in_progress' || data.backgroundCheck.backgroundCheckStatus === 'completed') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verificación de Antecedentes en Proceso
          </h3>
          <p className="text-gray-600 mb-6">
            Tu verificación de antecedentes ha sido iniciada exitosamente. 
            Recibirás notificaciones sobre el progreso por correo electrónico.
          </p>
        </div>

        <Card variant="outline" className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">ID de Verificación:</span>
              <span className="text-gray-600 font-mono">{data.backgroundCheck.backgroundCheckId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Estado:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                En Proceso
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Fecha Estimada de Finalización:</span>
              <span className="text-gray-600">
                {data.backgroundCheck.estimatedCompletionDate ? 
                  new Date(data.backgroundCheck.estimatedCompletionDate).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 
                  'Por determinar'
                }
              </span>
            </div>
          </div>
        </Card>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-green-500 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h5 className="font-medium text-green-900 mb-1">¡Excelente!</h5>
              <p className="text-sm text-green-800">
                Has completado todos los pasos del registro. Te notificaremos por correo electrónico 
                cuando tu verificación de antecedentes esté completa y puedas comenzar a trabajar.
              </p>
            </div>
          </div>
        </div>

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
            className="px-6 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors"
          >
            Completar Registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Verificación de Antecedentes
        </h3>
        <p className="text-gray-600 mb-6">
          Para garantizar la seguridad de todos los usuarios, necesitamos realizar una verificación de antecedentes. 
          Este proceso es completamente confidencial y seguro.
        </p>
      </div>

      {/* Background Check Process */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          ¿Qué incluye la verificación?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {backgroundCheckSteps.map((step, index) => (
            <Card key={index} variant="outline" className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{step.icon}</div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">{step.title}</h5>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <p className="text-xs text-blue-600">{step.duration}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Consent Form */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Autorización y Consentimiento
        </h4>
        <p className="text-gray-600 mb-6 text-sm">
          Para proceder con la verificación de antecedentes, necesitamos tu autorización explícita 
          para acceder a la información necesaria. Lee cuidadosamente cada punto y marca tu consentimiento.
        </p>

        <div className="space-y-4">
          {consentItems.map((item) => (
            <Card key={item.id} variant="outline" className="p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={item.id}
                  checked={consentGiven[item.id] || false}
                  onChange={(e) => handleConsentChange(item.id, e.target.checked)}
                  className="w-4 h-4 text-[#e4007c] border-gray-300 rounded focus:ring-[#e4007c] mt-1"
                />
                <div className="flex-1">
                  <label htmlFor={item.id} className="cursor-pointer">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-semibold text-gray-900">{item.title}</h5>
                      {item.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </label>
                  {allErrors[item.id] && (
                    <p className="mt-1 text-sm text-red-600">{allErrors[item.id]}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Legal Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-gray-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-1">Información Legal</h5>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• Toda la información será tratada de forma confidencial</p>
              <p>• Solo personal autorizado tendrá acceso a los resultados</p>
              <p>• Los datos se utilizarán únicamente para fines de verificación</p>
              <p>• Tienes derecho a conocer los resultados de la verificación</p>
              <p>• Puedes solicitar correcciones si encuentras información incorrecta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Tiempo Estimado</h5>
            <p className="text-sm text-blue-800">
              El proceso completo de verificación toma entre <strong>5-10 días hábiles</strong>. 
              Te mantendremos informado del progreso por correo electrónico y podrás consultar 
              el estado en tu panel de repartidor.
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {Object.keys(allErrors).length > 0 && (
        <ErrorMessage message="Por favor, autoriza todos los elementos requeridos antes de continuar." />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          disabled={isLoading || isInitiating}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <button
          onClick={handleNext}
          disabled={isLoading || isInitiating || !canProceed}
          className="px-6 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isInitiating && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>
            {isInitiating ? 'Iniciando Verificación...' : 'Iniciar Verificación'}
          </span>
        </button>
      </div>
    </div>
  );
}