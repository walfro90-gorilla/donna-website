// components/FormButton.tsx
"use client";

import LoadingSpinner from './LoadingSpinner';
import { 
  generateResponsiveComponentSizes, 
  generateFocusRingClasses, 
  generateTouchFriendlyClasses,
  generateAriaAttributes,
  ACCESSIBILITY 
} from '@/lib/utils';

interface FormButtonProps {
  type?: 'button' | 'submit' | 'reset';
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl' | { base: 'sm' | 'md' | 'lg' | 'xl'; mobile?: 'sm' | 'md' | 'lg' | 'xl'; tablet?: 'sm' | 'md' | 'lg' | 'xl'; desktop?: 'sm' | 'md' | 'lg' | 'xl' };
  fullWidth?: boolean;
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
}

export default function FormButton({
  type = 'button',
  isLoading = false,
  disabled = false,
  children,
  className = '',
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed,
}: FormButtonProps) {
  const variantClasses = {
    primary: 'bg-[#e4007c] text-white hover:bg-[#c6006b] active:bg-[#a8005a] disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
  };

  // Responsive size classes
  const responsiveSizeClasses = typeof size === 'object' 
    ? generateResponsiveComponentSizes('button', size)
    : generateResponsiveComponentSizes('button', { base: size });

  // Touch-friendly classes for mobile
  const touchClasses = generateTouchFriendlyClasses('md');

  // Focus ring classes
  const focusClasses = generateFocusRingClasses(
    variant === 'primary' ? '#e4007c' : 
    variant === 'danger' ? '#dc2626' : '#6b7280'
  );

  // Generate ARIA attributes
  const ariaAttributes = generateAriaAttributes({
    label: ariaLabel,
    describedBy: ariaDescribedBy,
    expanded: ariaExpanded,
  });

  const baseClasses = `
    font-medium rounded-md inline-flex items-center justify-center
    transition-all duration-200 ease-in-out
    disabled:cursor-not-allowed disabled:opacity-50
    ${variantClasses[variant]}
    ${responsiveSizeClasses}
    ${touchClasses}
    ${focusClasses}
    ${fullWidth ? 'w-full' : ''}
  `;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      aria-busy={isLoading}
      aria-pressed={ariaPressed}
      {...ariaAttributes}
    >
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          className="mr-2" 
          aria-hidden="true"
        />
      )}
      <span className={isLoading ? 'opacity-75' : ''}>
        {children}
      </span>
      {isLoading && (
        <span className="sr-only">
          {ACCESSIBILITY.ariaLabels.loading}
        </span>
      )}
    </button>
  );
}

