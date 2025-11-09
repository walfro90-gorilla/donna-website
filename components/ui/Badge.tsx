// components/ui/Badge.tsx
"use client";

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  removable = false,
  onRemove,
  className = '',
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium transition-colors duration-200';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    primary: 'bg-[#e4007c] text-white',
    secondary: 'bg-gray-600 text-white',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';

  return (
    <span
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${roundedClasses}
        ${className}
      `}
    >
      {children}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 -mr-1 p-0.5 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
          aria-label="Remover"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Specialized badge variants
export function StatusBadge({ 
  status, 
  className = '' 
}: { 
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected'; 
  className?: string; 
}) {
  const statusConfig = {
    active: { variant: 'success' as const, text: 'Activo' },
    inactive: { variant: 'default' as const, text: 'Inactivo' },
    pending: { variant: 'warning' as const, text: 'Pendiente' },
    approved: { variant: 'success' as const, text: 'Aprobado' },
    rejected: { variant: 'error' as const, text: 'Rechazado' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size="sm" rounded className={className}>
      {config.text}
    </Badge>
  );
}

export function CountBadge({ 
  count, 
  max = 99, 
  className = '' 
}: { 
  count: number; 
  max?: number; 
  className?: string; 
}) {
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant="primary" size="sm" rounded className={className}>
      {displayCount}
    </Badge>
  );
}