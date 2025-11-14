// components/demo/RestaurantRegistrationDemo.tsx
"use client";

import { useState, useCallback } from 'react';
import { Card, Alert, Badge } from '@/components/ui';
import {
  BusinessInformationStep,
  LocationAddressStep,
  LegalDocumentationStep,
  BrandingMediaStep,
  MenuCreationStep,
  ReviewSubmitStep,
  type BusinessInformation,
  type LocationAddress,
  type LegalDocumentation,
  type BrandingMedia,
  type MenuCreation,
  type ReviewSubmitData
} from '@/components/registration';

interface RegistrationData {
  businessInfo: Partial<BusinessInformation>;
  location: Partial<LocationAddress>;
  legal: Partial<LegalDocumentation>;
  branding: Partial<BrandingMedia>;
  menu: Partial<MenuCreation>;
  review: Partial<ReviewSubmitData>;
}

const REGISTRATION_STEPS = [
  {
    id: 'business',
    title: 'Información del Negocio',
    description: 'Datos básicos de tu restaurante'
  },
  {
    id: 'location',
    title: 'Ubicación',
    description: 'Dirección y características del local'
  },
  {
    id: 'legal',
    title: 'Documentación Legal',
    description: 'Documentos requeridos para operar'
  },
  {
    id: 'branding',
    title: 'Imagen de Marca',
    description: 'Logo, colores y presencia digital'
  },
  {
    id: 'menu',
    title: 'Creación del Menú',
    description: 'Platillos y categorías'
  },
  {
    id: 'review',
    title: 'Revisión y Envío',
    description: 'Confirma tu información y envía el registro'
  }
];

export default function RestaurantRegistrationDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    businessInfo: {},
    location: {},
    legal: {},
    branding: {},
    menu: {},
    review: {
      businessInfo: {},
      location: {},
      legal: {},
      branding: {},
      menu: {},
      termsAccepted: false,
      privacyAccepted: false,
      marketingOptIn: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStepDataChange = useCallback((stepId: string, data: any) => {
    setRegistrationData(prev => ({
      ...prev,
      [stepId]: data
    }));
  }, []);

  const handleNext = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (currentStep < REGISTRATION_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setMessage({ 
          type: 'success', 
          text: `Paso "${REGISTRATION_STEPS[currentStep].title}" completado exitosamente` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al guardar la información. Por favor intenta de nuevo.' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate final submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage({ 
        type: 'success', 
        text: '¡Registro completado exitosamente! Tu restaurante será revisado y activado en 24-48 horas.' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al enviar el registro. Por favor intenta de nuevo.' 
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    // Simulate image upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    return URL.createObjectURL(file);
  }, []);

  const handleDocumentUpload = useCallback(async (file: File, type: string): Promise<string> => {
    // Simulate document upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    return URL.createObjectURL(file);
  }, []);

  const getCompletionStats = useCallback(() => {
    const steps = [
      { 
        name: 'Información del Negocio', 
        completed: !!(registrationData.businessInfo.businessName && registrationData.businessInfo.businessType) 
      },
      { 
        name: 'Ubicación', 
        completed: !!(registrationData.location.street && registrationData.location.city) 
      },
      { 
        name: 'Documentación Legal', 
        completed: !!(registrationData.legal.businessLegalName && registrationData.legal.taxId) 
      },
      { 
        name: 'Imagen de Marca', 
        completed: !!registrationData.branding.logo 
      },
      { 
        name: 'Menú', 
        completed: !!(registrationData.menu.menuItems && registrationData.menu.menuItems.length >= 15) 
      },
      { 
        name: 'Revisión y Envío', 
        completed: !!(registrationData.review?.termsAccepted && registrationData.review?.privacyAccepted) 
      }
    ];
    
    const completedSteps = steps.filter(step => step.completed).length;
    return {
      steps,
      completedSteps,
      totalSteps: steps.length,
      percentage: Math.round((completedSteps / steps.length) * 100)
    };
  }, [registrationData]);

  const stats = getCompletionStats();

  const renderCurrentStep = () => {
    const stepId = REGISTRATION_STEPS[currentStep].id;
    
    switch (stepId) {
      case 'business':
        return (
          <BusinessInformationStep
            data={registrationData.businessInfo}
            onDataChange={(data) => handleStepDataChange('businessInfo', data)}
            onNext={handleNext}
            onPrevious={currentStep > 0 ? handlePrevious : undefined}
            isLoading={isLoading}
          />
        );
      
      case 'location':
        return (
          <LocationAddressStep
            data={registrationData.location}
            onDataChange={(data) => handleStepDataChange('location', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );
      
      case 'legal':
        return (
          <LegalDocumentationStep
            data={registrationData.legal}
            onDataChange={(data) => handleStepDataChange('legal', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            onDocumentUpload={handleDocumentUpload}
          />
        );
      
      case 'branding':
        return (
          <BrandingMediaStep
            data={registrationData.branding}
            onDataChange={(data) => handleStepDataChange('branding', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            onImageUpload={handleImageUpload}
          />
        );
      
      case 'menu':
        return (
          <MenuCreationStep
            data={registrationData.menu}
            onDataChange={(data) => handleStepDataChange('menu', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            onImageUpload={handleImageUpload}
            minimumItems={15}
          />
        );
      
      case 'review':
        return (
          <ReviewSubmitStep
            data={{
              businessInfo: registrationData.businessInfo,
              location: registrationData.location,
              legal: registrationData.legal,
              branding: registrationData.branding,
              menu: registrationData.menu,
              termsAccepted: registrationData.review?.termsAccepted || false,
              privacyAccepted: registrationData.review?.privacyAccepted || false,
              marketingOptIn: registrationData.review?.marketingOptIn || false,
              submissionNotes: registrationData.review?.submissionNotes
            }}
            onDataChange={(data) => handleStepDataChange('review', data)}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demo: Registro de Restaurante Completo
        </h1>
        <p className="text-lg text-gray-600">
          Sistema completo de registro con validación de documentos, creación de menú y gestión de marca
        </p>
        <div className="mt-4">
          <Badge variant={stats.percentage >= 80 ? 'success' : 'warning'}>
            {stats.completedSteps}/{stats.totalSteps} pasos completados ({stats.percentage}%)
          </Badge>
        </div>
      </div>

      {message && (
        <Alert 
          variant={message.type === 'success' ? 'success' : 'error'}
          dismissible
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Progress Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Progreso del Registro
        </h2>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-[#e4007c] h-3 rounded-full transition-all duration-300"
            style={{ width: `${stats.percentage}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {stats.steps.map((step, index) => (
            <div 
              key={step.name}
              className={`
                p-3 rounded-lg border text-center
                ${step.completed 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : index === currentStep
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }
              `}
            >
              <div className="flex items-center justify-center mb-2">
                {step.completed ? (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : index === currentStep ? (
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              <p className="text-xs font-medium">{step.name}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Step Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Paso {currentStep + 1} de {REGISTRATION_STEPS.length}
          </h3>
          <div className="text-sm text-gray-600">
            {REGISTRATION_STEPS[currentStep].title}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {REGISTRATION_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                      ? 'bg-[#e4007c] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {index < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < REGISTRATION_STEPS.length - 1 && (
                <div 
                  className={`
                    w-12 h-1 mx-2
                    ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                ></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {REGISTRATION_STEPS[currentStep].description}
          </p>
        </div>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-screen">
        {renderCurrentStep()}
      </div>

      {/* Features Showcase */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✨ Características del Sistema de Registro Completo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Registro multi-paso con validación en tiempo real</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Integración con Google Maps para direcciones</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Subida y validación de documentos legales</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Gestión completa de imagen de marca</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Constructor de menú con mínimo de 15 platillos</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Optimización automática de imágenes</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Persistencia de datos entre pasos</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Validación de cumplimiento legal mexicano</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Vista previa del menú para clientes</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Indicadores de progreso y completitud</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Interfaz responsive y accesible</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Manejo de errores y estados de carga</span>
          </div>
        </div>
      </Card>

      {/* Registration Data Debug (for demo purposes) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 Datos de Registro (Solo en Desarrollo)
          </h3>
          <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
            {JSON.stringify(registrationData, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}