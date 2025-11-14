// components/forms/StepperForm.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, LoadingSpinner, ProgressIndicator, FormSkeleton } from '@/components/ui';
import { 
  generateResponsiveFontClasses,
  generateResponsiveSpacingClasses,
  generateAriaAttributes,
  announceToScreenReader,
  ACCESSIBILITY 
} from '@/lib/utils';

export interface RegistrationStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  validation?: (data: any) => Promise<ValidationResult> | ValidationResult;
  isOptional?: boolean;
  dependencies?: string[];
}

export interface StepProps {
  data: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
  onValidate?: () => Promise<boolean>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: Record<string, string>;
  warnings?: Record<string, string>;
}

interface StepperFormProps {
  steps: RegistrationStep[];
  initialData?: any;
  onComplete: (data: any) => Promise<void>;
  onStepChange?: (currentStep: number, stepId: string) => void;
  allowSkipOptional?: boolean;
  persistKey?: string;
  className?: string;
}

export default function StepperForm({
  steps,
  initialData = {},
  onComplete,
  onStepChange,
  allowSkipOptional = true,
  persistKey,
  className = '',
}: StepperFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [stepValidation, setStepValidation] = useState<Record<string, ValidationResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);

  // Load persisted data on mount
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      const savedData = localStorage.getItem(`stepper-form-${persistKey}`);
      const savedStep = localStorage.getItem(`stepper-form-step-${persistKey}`);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData({ ...initialData, ...parsedData });
        } catch (error) {
          console.warn('Failed to parse saved form data:', error);
        }
      }
      
      if (savedStep) {
        const stepIndex = parseInt(savedStep, 10);
        if (stepIndex >= 0 && stepIndex < steps.length) {
          setCurrentStepIndex(stepIndex);
        }
      }
    }
  }, [persistKey, initialData, steps.length]);

  // Persist data when it changes
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(`stepper-form-${persistKey}`, JSON.stringify(formData));
      localStorage.setItem(`stepper-form-step-${persistKey}`, currentStepIndex.toString());
    }
  }, [formData, currentStepIndex, persistKey]);

  // Notify parent of step changes and announce to screen readers
  useEffect(() => {
    if (onStepChange && steps[currentStepIndex]) {
      onStepChange(currentStepIndex, steps[currentStepIndex].id);
    }
    
    // Announce step change to screen readers
    if (steps[currentStepIndex]) {
      const stepInfo = `Paso ${currentStepIndex + 1} de ${steps.length}: ${steps[currentStepIndex].title}`;
      announceToScreenReader(stepInfo, 'polite');
    }
  }, [currentStepIndex, onStepChange, steps]);

  const validateStep = useCallback(async (stepIndex: number, data: any): Promise<ValidationResult> => {
    const step = steps[stepIndex];
    if (!step.validation) {
      return { isValid: true };
    }

    try {
      const result = await step.validation(data);
      return result;
    } catch (error) {
      console.error('Step validation error:', error);
      return {
        isValid: false,
        errors: { general: 'Error de validación. Por favor, inténtalo de nuevo.' }
      };
    }
  }, [steps]);

  const handleDataChange = useCallback((newData: any) => {
    setFormData((prevData: any) => ({ ...prevData, ...newData }));
  }, []);

  const handleNext = useCallback(async () => {
    const currentStep = steps[currentStepIndex];
    setIsLoading(true);
    setLoadingStep(currentStep.id);
    setValidationProgress(0);

    try {
      // Show validation progress
      setValidationProgress(25);
      
      // Validate current step
      const validation = await validateStep(currentStepIndex, formData);
      setValidationProgress(50);
      
      setStepValidation(prev => ({
        ...prev,
        [currentStep.id]: validation
      }));

      if (!validation.isValid) {
        setValidationProgress(0);
        setIsLoading(false);
        setLoadingStep(null);
        return;
      }

      setValidationProgress(75);

      // Mark step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));

      // Check if this is the last step
      if (currentStepIndex === steps.length - 1) {
        setValidationProgress(90);
        await onComplete(formData);
        setValidationProgress(100);
        
        // Clear persisted data on successful completion
        if (persistKey && typeof window !== 'undefined') {
          localStorage.removeItem(`stepper-form-${persistKey}`);
          localStorage.removeItem(`stepper-form-step-${persistKey}`);
        }
      } else {
        // Move to next step
        setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
        setValidationProgress(100);
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      setStepValidation(prev => ({
        ...prev,
        [currentStep.id]: {
          isValid: false,
          errors: { general: 'Error inesperado. Por favor, inténtalo de nuevo.' }
        }
      }));
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStep(null);
        setValidationProgress(0);
      }, 500);
    }
  }, [currentStepIndex, steps, formData, validateStep, onComplete, persistKey]);

  const handlePrevious = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSkipStep = useCallback(() => {
    const currentStep = steps[currentStepIndex];
    if (currentStep.isOptional && allowSkipOptional) {
      if (currentStepIndex === steps.length - 1) {
        onComplete(formData);
      } else {
        setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
      }
    }
  }, [currentStepIndex, steps, allowSkipOptional, formData, onComplete]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, [steps.length]);

  const getCompletionPercentage = useCallback(() => {
    return Math.round((completedSteps.size / steps.length) * 100);
  }, [completedSteps.size, steps.length]);

  const canGoToStep = useCallback((stepIndex: number) => {
    // Can always go to previous steps
    if (stepIndex <= currentStepIndex) return true;
    
    // Can go to next step only if all previous required steps are completed
    for (let i = 0; i < stepIndex; i++) {
      const step = steps[i];
      if (!step.isOptional && !completedSteps.has(step.id)) {
        return false;
      }
    }
    return true;
  }, [currentStepIndex, steps, completedSteps]);

  if (!steps.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay pasos configurados para este formulario.</p>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const currentValidation = stepValidation[currentStep.id];
  const StepComponent = currentStep.component;

  return (
    <div className={`max-w-4xl mx-auto ${generateResponsiveSpacingClasses('px', { base: '4', tablet: '6', desktop: '8' })} ${className}`}>
      {/* Progress Header */}
      <div className={generateResponsiveSpacingClasses('mb', { base: '6', tablet: '8' })}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h1 
            className={`${generateResponsiveFontClasses({ base: 'xl', tablet: '2xl' })} font-bold text-gray-900`}
            id="stepper-title"
          >
            {currentStep.title}
          </h1>
          <div 
            className="text-sm text-gray-500"
            aria-label={`Paso ${currentStepIndex + 1} de ${steps.length}`}
          >
            Paso {currentStepIndex + 1} de {steps.length}
          </div>
        </div>
        
        {currentStep.description && (
          <p 
            className="text-gray-600 mb-4 text-sm sm:text-base"
            id="stepper-description"
          >
            {currentStep.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div 
            className="w-full bg-gray-200 rounded-full h-2"
            role="progressbar"
            aria-valuenow={((currentStepIndex + 1) / steps.length) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso del formulario: ${getCompletionPercentage()}% completado`}
          >
            <div
              className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Validation Progress */}
          {isLoading && validationProgress > 0 && (
            <div className="w-full bg-blue-100 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                style={{ width: `${validationProgress}%` }}
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mt-2 gap-1">
          <span>{getCompletionPercentage()}% completado</span>
          <span>{completedSteps.size} de {steps.length} pasos completados</span>
        </div>
      </div>

      {/* Step Content */}
      <Card 
        variant="default" 
        className={generateResponsiveSpacingClasses('mb', { base: '6', tablet: '8' })}
        role="main"
        ariaLabelledBy="stepper-title"
        ariaDescribedBy={currentStep.description ? "stepper-description" : undefined}
      >
        <CardContent className={generateResponsiveSpacingClasses('p', { base: '4', tablet: '6' })}>
          {loadingStep === currentStep.id ? (
            <div className="space-y-4">
              <FormSkeleton />
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <LoadingSpinner size="sm" variant="spinner" />
                <span>
                  {validationProgress < 50 ? 'Validando datos...' :
                   validationProgress < 90 ? 'Procesando...' :
                   'Finalizando...'}
                </span>
              </div>
            </div>
          ) : (
            <StepComponent
              data={formData}
              onDataChange={handleDataChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
              errors={currentValidation?.errors}
              onValidate={async () => {
                const validation = await validateStep(currentStepIndex, formData);
                setStepValidation(prev => ({
                  ...prev,
                  [currentStep.id]: validation
                }));
                return validation.isValid;
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <nav 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        aria-label="Navegación del formulario"
      >
        <button
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
          className={`
            px-4 sm:px-6 py-2 text-gray-600 border border-gray-300 rounded-lg 
            hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-colors min-h-[44px] order-2 sm:order-1
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          `}
          aria-label={ACCESSIBILITY.ariaLabels.previous}
        >
          {ACCESSIBILITY.ariaLabels.previous}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 order-1 sm:order-2">
          {currentStep.isOptional && allowSkipOptional && (
            <button
              onClick={handleSkipStep}
              className={`
                px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors
                min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              `}
              aria-label="Omitir este paso opcional"
            >
              Omitir (opcional)
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={isLoading}
            className={`
              px-4 sm:px-6 py-2 bg-[#e4007c] text-white rounded-lg 
              hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed 
              transition-colors flex items-center justify-center space-x-2 min-h-[44px]
              focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2
            `}
            aria-label={currentStepIndex === steps.length - 1 ? 'Completar formulario' : 'Ir al siguiente paso'}
            aria-busy={isLoading}
          >
            {isLoading && (
              <svg 
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {currentStepIndex === steps.length - 1 ? 'Completar' : ACCESSIBILITY.ariaLabels.next}
            </span>
            {isLoading && (
              <span className="sr-only">
                {ACCESSIBILITY.ariaLabels.loading}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}

// Export utility functions for external use
export const stepperFormUtils = {
  clearPersistedData: (persistKey: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stepper-form-${persistKey}`);
      localStorage.removeItem(`stepper-form-step-${persistKey}`);
    }
  },
  
  getPersistedData: (persistKey: string) => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(`stepper-form-${persistKey}`);
      return savedData ? JSON.parse(savedData) : null;
    }
    return null;
  },
  
  hasPersistedData: (persistKey: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`stepper-form-${persistKey}`) !== null;
    }
    return false;
  }
};