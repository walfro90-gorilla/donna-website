// components/ui/Button.tsx
"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { 
  generateResponsiveComponentSizes,
  generateFocusRingClasses,
  generateTouchFriendlyClasses,
  generateAriaAttributes,
  ACCESSIBILITY,
  type ResponsiveValue 
} from '@/lib/utils';
import LoadingSpinner from '../LoadingSpinner';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl' | ResponsiveValue<'sm' | 'md' | 'lg' | 'xl'>;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  // Enhanced accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed,
  'aria-haspopup': ariaHasPopup,
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-md
    transition-all duration-200 ease-in-out
    disabled:cursor-not-allowed disabled:opacity-50
    focus:outline-none
  `;

  // Variant classes
  const variantClasses = {
    primary: `
      bg-[#e4007c] text-white border border-[#e4007c]
      hover:bg-[#c6006b] hover:border-[#c6006b]
      active:bg-[#a8005a] active:border-[#a8005a]
      disabled:bg-gray-400 disabled:border-gray-400
    `,
    secondary: `
      bg-gray-200 text-gray-800 border border-gray-200
      hover:bg-gray-300 hover:border-gray-300
      active:bg-gray-400 active:border-gray-400
      disabled:bg-gray-100 disabled:border-gray-100
    `,
    outline: `
      bg-transparent text-[#e4007c] border border-[#e4007c]
      hover:bg-[#e4007c] hover:text-white
      active:bg-[#c6006b] active:border-[#c6006b]
      disabled:text-gray-400 disabled:border-gray-400
    `,
    ghost: `
      bg-transparent text-[#e4007c] border border-transparent
      hover:bg-[#fef2f9] hover:text-[#c6006b]
      active:bg-[#fce4f3] active:text-[#a8005a]
      disabled:text-gray-400
    `,
    danger: `
      bg-red-600 text-white border border-red-600
      hover:bg-red-700 hover:border-red-700
      active:bg-red-800 active:border-red-800
      disabled:bg-red-300 disabled:border-red-300
    `,
    success: `
      bg-green-600 text-white border border-green-600
      hover:bg-green-700 hover:border-green-700
      active:bg-green-800 active:border-green-800
      disabled:bg-green-300 disabled:border-green-300
    `,
    warning: `
      bg-yellow-600 text-white border border-yellow-600
      hover:bg-yellow-700 hover:border-yellow-700
      active:bg-yellow-800 active:border-yellow-800
      disabled:bg-yellow-300 disabled:border-yellow-300
    `,
    info: `
      bg-blue-600 text-white border border-blue-600
      hover:bg-blue-700 hover:border-blue-700
      active:bg-blue-800 active:border-blue-800
      disabled:bg-blue-300 disabled:border-blue-300
    `,
  };

  // Responsive size classes
  const responsiveSizeClasses = typeof size === 'object' 
    ? generateResponsiveComponentSizes('button', size)
    : generateResponsiveComponentSizes('button', { base: size });

  // Touch-friendly classes
  const touchClasses = generateTouchFriendlyClasses('md');

  // Focus ring classes
  const focusColor = {
    primary: '#e4007c',
    secondary: '#6b7280',
    outline: '#e4007c',
    ghost: '#e4007c',
    danger: '#dc2626',
    success: '#16a34a',
    warning: '#ca8a04',
    info: '#2563eb',
  }[variant];

  const focusClasses = generateFocusRingClasses(focusColor);

  // Generate ARIA attributes
  const ariaAttributes = generateAriaAttributes({
    label: ariaLabel,
    describedBy: ariaDescribedBy,
    expanded: ariaExpanded,
  });

  // Add aria-pressed separately if provided
  if (ariaPressed !== undefined) {
    ariaAttributes['aria-pressed'] = ariaPressed;
  }

  // Additional ARIA attributes
  if (ariaHasPopup !== undefined) {
    ariaAttributes['aria-haspopup'] = ariaHasPopup;
  }

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${responsiveSizeClasses}
    ${touchClasses}
    ${focusClasses}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={combinedClasses}
      aria-busy={isLoading}
      {...ariaAttributes}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          className="mr-2" 
          aria-hidden="true"
        />
      )}

      {/* Left icon */}
      {!isLoading && leftIcon && (
        <span className="mr-2" aria-hidden="true">
          {leftIcon}
        </span>
      )}

      {/* Button content */}
      <span className={isLoading ? 'opacity-75' : ''}>
        {isLoading && loadingText ? loadingText : children}
      </span>

      {/* Right icon */}
      {!isLoading && rightIcon && (
        <span className="ml-2" aria-hidden="true">
          {rightIcon}
        </span>
      )}

      {/* Screen reader loading text */}
      {isLoading && (
        <span className="sr-only">
          {ACCESSIBILITY.ariaLabels.loading}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;