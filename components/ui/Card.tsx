// components/ui/Card.tsx
"use client";

import { ReactNode, KeyboardEvent } from 'react';
import { generateResponsiveComponentSizes, generateFocusRingClasses, generateAriaAttributes } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg' | { base: 'sm' | 'md' | 'lg'; mobile?: 'sm' | 'md' | 'lg'; tablet?: 'sm' | 'md' | 'lg'; desktop?: 'sm' | 'md' | 'lg' };
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  // Accessibility props
  role?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  padding = 'md',
  hover = false,
  onClick,
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  tabIndex,
}: CardProps) {
  const baseClasses = 'rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-transparent border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-200',
  };

  // Responsive size classes
  const responsiveSizeClasses = typeof size === 'object' 
    ? generateResponsiveComponentSizes('card', size)
    : generateResponsiveComponentSizes('card', { base: size });

  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const hoverClasses = hover 
    ? 'hover:shadow-md hover:border-gray-300 cursor-pointer transform hover:-translate-y-1 focus-within:shadow-md' 
    : '';

  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  // Focus ring for accessibility
  const focusClasses = onClick ? generateFocusRingClasses() : '';
  
  // Generate ARIA attributes
  const ariaAttributes = generateAriaAttributes({
    label: ariaLabel,
    labelledBy: ariaLabelledBy,
    describedBy: ariaDescribedBy,
    role: role as any,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${responsiveSizeClasses}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${clickableClasses}
        ${focusClasses}
        ${className}
      `}
      onClick={onClick}
      tabIndex={onClick ? (tabIndex ?? 0) : tabIndex}
      onKeyDown={handleKeyDown}
      {...ariaAttributes}
    >
      {children}
    </div>
  );
}

// Card sub-components for better composition
export function CardHeader({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}