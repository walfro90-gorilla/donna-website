// components/forms/StepNavigation.tsx
"use client";

import { Badge } from '@/components/ui';

export interface NavigationStep {
  id: string;
  title: string;
  isOptional?: boolean;
  isCompleted?: boolean;
  hasErrors?: boolean;
}

export interface StepNavigationProps {
  steps: NavigationStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  canGoToStep?: (stepIndex: number) => boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  allowSkipOptional?: boolean;
  className?: string;
}

export default function StepNavigation({
  steps,
  currentStep,
  onStepClick,
  canGoToStep,
  onNext,
  onPrevious,
  onSkip,
  isLoading = false,
  allowSkipOptional = true,
  className = '',
}: StepNavigationProps) {
  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canSkipCurrent = currentStepData?.isOptional && allowSkipOptional;

  const handleStepClick = (stepIndex: number) => {
    if (onStepClick && canGoToStep && canGoToStep(stepIndex)) {
      onStepClick(stepIndex);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, stepIndex: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStepClick(stepIndex);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step Navigation Breadcrumb */}
      <nav aria-label="Progreso del formulario" className="hidden md:block">
        <ol className="flex items-center space-x-2 text-sm">
          {steps.map((step, index) => {
            const isCurrent = index === currentStep;
            const isClickable = canGoToStep ? canGoToStep(index) : false;
            const isCompleted = step.isCompleted;
            const hasErrors = step.hasErrors;

            return (
              <li key={step.id} className="flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-300 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                
                <button
                  onClick={() => handleStepClick(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={!isClickable}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md transition-colors
                    ${isCurrent 
                      ? 'bg-[#e4007c] text-white' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : hasErrors
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : isClickable 
                            ? 'text-gray-600 hover:bg-gray-100' 
                            : 'text-gray-400 cursor-not-allowed'
                    }
                    ${isClickable ? 'focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2' : ''}
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${isCurrent ? 'Paso actual: ' : ''}${step.title}${step.isOptional ? ' (opcional)' : ''}`}
                >
                  {/* Step Icon */}
                  <span className="flex items-center justify-center w-5 h-5">
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : hasErrors ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </span>
                  
                  {/* Step Title */}
                  <span className="font-medium">{step.title}</span>
                  
                  {/* Optional Badge */}
                  {step.isOptional && (
                    <Badge variant="default" size="sm" className="ml-1">
                      Opcional
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <div className="flex items-center space-x-2">
            {currentStepData?.isOptional && (
              <Badge variant="default" size="sm">
                Opcional
              </Badge>
            )}
            {currentStepData?.hasErrors && (
              <Badge variant="error" size="sm">
                Errores
              </Badge>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {currentStepData?.title}
        </h2>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={isFirstStep || isLoading}
          className="
            flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg
            hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Anterior</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Skip Button */}
          {canSkipCurrent && onSkip && (
            <button
              onClick={onSkip}
              disabled={isLoading}
              className="
                px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Omitir (opcional)
            </button>
          )}

          {/* Next/Complete Button */}
          <button
            onClick={onNext}
            disabled={isLoading}
            className="
              flex items-center space-x-2 px-6 py-2 bg-[#e4007c] text-white rounded-lg
              hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:ring-offset-2
            "
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {isLastStep ? 'Completar Registro' : 'Siguiente'}
            </span>
            {!isLastStep && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Step Summary for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Paso {currentStep + 1} de {steps.length}: {currentStepData?.title}
        {currentStepData?.isOptional && ' (paso opcional)'}
        {currentStepData?.hasErrors && ' (contiene errores que deben corregirse)'}
        {currentStepData?.isCompleted && ' (completado)'}
      </div>
    </div>
  );
}

// Simplified navigation for basic use cases
export function SimpleStepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isLoading = false,
  nextLabel = 'Siguiente',
  previousLabel = 'Anterior',
  className = '',
}: {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  className?: string;
}) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        onClick={onPrevious}
        disabled={isFirstStep || isLoading}
        className="
          flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg
          hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        "
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>{previousLabel}</span>
      </button>

      <div className="text-sm text-gray-500">
        {currentStep + 1} de {totalSteps}
      </div>

      <button
        onClick={onNext}
        disabled={isLoading}
        className="
          flex items-center space-x-2 px-6 py-2 bg-[#e4007c] text-white rounded-lg
          hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        "
      >
        <span>{isLastStep ? 'Completar' : nextLabel}</span>
        {!isLastStep && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
}