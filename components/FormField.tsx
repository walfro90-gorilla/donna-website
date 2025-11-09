// components/FormField.tsx
"use client";

import { ValidationStatus } from '@/types/form';
import ErrorMessage from './ErrorMessage';

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
  'aria-describedby'?: string;
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
  'aria-describedby': ariaDescribedBy,
}: FormFieldProps) {
  // Determinar clases del borde según el estado de validación
  const getBorderClasses = () => {
    const baseClasses = 'mt-1 block w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none transition-colors bg-white text-gray-900 placeholder-gray-400';

    if (validationStatus === 'valid') {
      return `${baseClasses} border-green-500 focus:ring-green-500 focus:border-green-500`;
    }
    if (validationStatus === 'invalid') {
      return `${baseClasses} border-red-500 focus:ring-red-500 focus:border-red-500`;
    }
    if (validationStatus === 'checking') {
      return `${baseClasses} border-yellow-400 focus:ring-yellow-400 focus:border-yellow-400`;
    }

    return `${baseClasses} border-gray-300 focus:ring-[#e4007c] focus:border-[#e4007c]`;
  };

  // Determinar color del mensaje de validación
  const getValidationMessageClasses = () => {
    if (validationStatus === 'checking') return 'text-gray-500';
    if (validationStatus === 'valid') return 'text-green-600';
    if (validationStatus === 'invalid') return 'text-red-600';
    return 'text-transparent';
  };

  const validationId = `${id}-validation`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [
    ariaDescribedBy,
    validationStatus !== 'idle' && validationId,
    helpText && helpId,
    error && errorId,
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="requerido">*</span>}
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
        className={`${getBorderClasses()} ${inputClassName}`}
        aria-describedby={describedBy || undefined}
        aria-invalid={validationStatus === 'invalid' || !!error}
        aria-required={required}
      />
      
      {/* Mensaje de validación */}
      {validationStatus && validationStatus !== 'idle' && (
        <p
          id={validationId}
          className={`text-xs mt-1 min-h-[1rem] ${getValidationMessageClasses()}`}
          role="status"
          aria-live="polite"
        >
          {validationStatus === 'checking' && 'Verificando...'}
          {validationStatus === 'valid' && validationMessage && validationMessage}
          {validationStatus === 'invalid' && validationMessage && validationMessage}
        </p>
      )}

      {/* Mensaje de ayuda */}
      {helpText && (
        <p id={helpId} className="text-xs text-gray-500 mt-1">
          {helpText}
        </p>
      )}

      {/* Mensaje de error */}
      {error && (
        <ErrorMessage id={errorId} message={error} />
      )}
    </div>
  );
}

