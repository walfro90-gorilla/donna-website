// components/FormButton.tsx
"use client";

import LoadingSpinner from './LoadingSpinner';

interface FormButtonProps {
  type?: 'button' | 'submit' | 'reset';
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  'aria-label'?: string;
}

export default function FormButton({
  type = 'button',
  isLoading = false,
  disabled = false,
  children,
  className = '',
  onClick,
  variant = 'primary',
  fullWidth = false,
  'aria-label': ariaLabel,
}: FormButtonProps) {
  const variantClasses = {
    primary: 'bg-[#e4007c] text-white hover:bg-[#c6006b] disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  };

  const baseClasses = `
    font-bold py-3 px-4 rounded-md
    transition-colors duration-200
    disabled:cursor-not-allowed
    disabled:opacity-50
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${variantClasses[variant]}
    ${variant === 'primary' ? 'focus:ring-[#e4007c]' : ''}
    ${variant === 'secondary' ? 'focus:ring-gray-500' : ''}
    ${variant === 'danger' ? 'focus:ring-red-500' : ''}
    ${fullWidth ? 'w-full' : ''}
  `;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      aria-label={ariaLabel}
      aria-busy={isLoading}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading && <LoadingSpinner size="sm" />}
        <span>{children}</span>
      </span>
    </button>
  );
}

