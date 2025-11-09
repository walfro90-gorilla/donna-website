// components/forms/ProgressIndicator.tsx
"use client";

import { Badge } from '@/components/ui';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  completedSteps: Set<string>;
  onStepClick?: (stepIndex: number) => void;
  canGoToStep?: (stepIndex: number) => boolean;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

export default function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  canGoToStep,
  variant = 'horizontal',
  showLabels = true,
  className = '',
}: ProgressIndicatorProps) {
  const getStepStatus = (stepIndex: number, stepId: string) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'previous';
    return 'upcoming';
  };

  const getStepClasses = (status: string, isClickable: boolean) => {
    const baseClasses = 'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200';
    
    const statusClasses = {
      completed: 'bg-green-500 text-white',
      current: 'bg-[#e4007c] text-white ring-4 ring-[#e4007c] ring-opacity-20',
      previous: 'bg-gray-300 text-gray-600',
      upcoming: 'bg-gray-100 text-gray-400 border-2 border-gray-200',
    };

    const hoverClasses = isClickable ? 'hover:scale-110 cursor-pointer' : '';
    
    return `${baseClasses} ${statusClasses[status as keyof typeof statusClasses]} ${hoverClasses}`;
  };

  const getConnectorClasses = (stepIndex: number) => {
    const isCompleted = stepIndex < currentStep || completedSteps.has(steps[stepIndex].id);
    return `flex-1 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`;
  };

  const handleStepClick = (stepIndex: number) => {
    if (onStepClick && canGoToStep && canGoToStep(stepIndex)) {
      onStepClick(stepIndex);
    }
  };

  const renderStepIcon = (stepIndex: number, stepId: string, status: string) => {
    if (status === 'completed') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    
    return <span>{stepIndex + 1}</span>;
  };

  if (variant === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => {
          const status = getStepStatus(index, step.id);
          const isClickable = canGoToStep ? canGoToStep(index) : false;
          
          return (
            <div key={step.id} className="flex items-start space-x-4">
              {/* Step Circle */}
              <div
                className={getStepClasses(status, isClickable)}
                onClick={() => handleStepClick(index)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStepClick(index);
                  }
                } : undefined}
                aria-label={`Paso ${index + 1}: ${step.title}`}
              >
                {renderStepIcon(index, step.id, status)}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className={`text-sm font-medium ${
                    status === 'current' ? 'text-[#e4007c]' : 
                    status === 'completed' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h3>
                  {step.isOptional && (
                    <Badge variant="default" size="sm">
                      Opcional
                    </Badge>
                  )}
                </div>
                
                {showLabels && step.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 mt-8 w-0.5 h-8 bg-gray-200" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index, step.id);
        const isClickable = canGoToStep ? canGoToStep(index) : false;
        
        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={getStepClasses(status, isClickable)}
                onClick={() => handleStepClick(index)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStepClick(index);
                  }
                } : undefined}
                aria-label={`Paso ${index + 1}: ${step.title}`}
              >
                {renderStepIcon(index, step.id, status)}
              </div>

              {/* Step Label */}
              {showLabels && (
                <div className="mt-2 text-center">
                  <div className="flex items-center space-x-1">
                    <p className={`text-xs font-medium ${
                      status === 'current' ? 'text-[#e4007c]' : 
                      status === 'completed' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    {step.isOptional && (
                      <Badge variant="default" size="sm">
                        Opcional
                      </Badge>
                    )}
                  </div>
                  
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-1 max-w-20 truncate">
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`mx-4 ${getConnectorClasses(index)} ${showLabels ? 'mb-8' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact progress indicator for mobile
export function CompactProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  className = '',
}: Pick<ProgressIndicatorProps, 'steps' | 'currentStep' | 'completedSteps' | 'className'>) {
  const completedCount = completedSteps.size;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Progress Text */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Paso {currentStep + 1} de {steps.length}
        </span>
        <span className="text-gray-500">
          {Math.round(progressPercentage)}% completado
        </span>
      </div>
      
      {/* Current Step Title */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">
          {steps[currentStep]?.title}
        </h3>
        {steps[currentStep]?.description && (
          <p className="text-sm text-gray-500 mt-1">
            {steps[currentStep].description}
          </p>
        )}
      </div>
    </div>
  );
}