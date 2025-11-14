// components/FormField.tsx
"use client";

import { ValidationStatus } from '@/types/form';
import ErrorMessage from './ErrorMessage';
import { 
  createFieldDescription,
  generateFocusRingClasses,
  generateTouchFriendlyClasses,
  generateResponsiveComponentSizes,
  ACCESSIBILITY 
} from '@/lib/utils';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validationStatus?: ValidationStatus;
  validationMessage?: string;
  error?: string;
  helpText?: string;
  className?: string;
  inputClassName?: string;
  minLength?: number;
  maxLength?: number;
  size?: 'sm' | 'md' | 'lg';
  // Enhanced accessibility props
  'aria-describedby'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  // Character count for text inputs
  showCharacterCount?: boolean;
}

export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  validationStatus,
  validationMessage,
  error,
  helpText,
  className = '',
  inputClassName = '',
  minLength,
  maxLength,
  size = 'md',
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  autoComplete,
  autoFocus = false,
  showCharacterCount = false,
}: FormFieldProps) {
  // Generate responsive size classes
  const responsiveSizeClasses = generateResponsiveComponentSizes('input', { base: size });
  
  // Generate touch-friendly classes
  const touchClasses = generateTouchFriendlyClasses('md');

  // Determinar clases del borde según el estado de validación
  const getBorderClasses = () => {
    const baseClasses = `
      mt-1 block w-full border rounded-md shadow-sm transition-all duration-200 
      bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-50 
      disabled:text-gray-500 disabled:cursor-not-allowed
      ${responsiveSizeClasses} ${touchClasses}
    `;

    if (validationStatus === 'valid') {
      return `${baseClasses} border-green-500 ${generateFocusRingClasses('#10b981')}`;
    }
    if (validationStatus === 'invalid' || error) {
      return `${baseClasses} border-red-500 ${generateFocusRingClasses('#ef4444')}`;
    }
    if (validationStatus === 'checking') {
      return `${baseClasses} border-yellow-400 ${generateFocusRingClasses('#f59e0b')}`;
    }

    return `${baseClasses} border-gray-300 ${generateFocusRingClasses('#e4007c')}`;
  };

  // Determinar color del mensaje de validación
  const getValidationMessageClasses = () => {
    if (validationStatus === 'checking') return 'text-gray-500';
    if (validationStatus === 'valid') return 'text-green-600';
    if (validationStatus === 'invalid') return 'text-red-600';
    return 'text-transparent';
  };

  // Create field descriptions using accessibility utility
  const fieldDescription = createFieldDescription({
    id,
    required,
    error: error || (validationStatus === 'invalid' ? validationMessage : undefined),
    help: helpText,
    characterCount: showCharacterCount && maxLength ? { current: value.length, max: maxLength } : undefined,
  });

  const describedBy = [
    ariaDescribedBy,
    fieldDescription.describedBy,
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
        id={`${id}-label`}
      >
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <span className="sr-only">{ACCESSIBILITY.ariaLabels.required}</span>
          </>
        )}
      </label>
      
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`${getBorderClasses()} ${inputClassName}`}
        aria-describedby={describedBy || undefined}
        aria-invalid={validationStatus === 'invalid' || !!error}
        aria-required={required}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy || `${id}-label`}
      />
      
      {/* Render field descriptions */}
      {fieldDescription.descriptionElements.map((desc) => (
        <div
          key={desc.id}
          id={desc.id}
          className={desc.className}
          role={desc.id.includes('error') ? 'alert' : 'status'}
          aria-live="polite"
        >
          {desc.content}
        </div>
      ))}

      {/* Validation status message */}
      {validationStatus && validationStatus !== 'idle' && validationStatus !== 'invalid' && (
        <p
          className={`text-xs mt-1 min-h-[1rem] ${getValidationMessageClasses()}`}
          role="status"
          aria-live="polite"
        >
          {validationStatus === 'checking' && ACCESSIBILITY.ariaLabels.loading}
          {validationStatus === 'valid' && validationMessage && validationMessage}
        </p>
      )}
    </div>
  );
}

