// lib/utils/variants.ts

import { cn } from './designSystem';

// Simple variant utility functions
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'info';
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// Button variant utility
export function getButtonClasses(
  variant: ComponentVariant = 'primary',
  size: ComponentSize = 'md',
  fullWidth: boolean = false,
  className?: string
): string {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-md',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const variantClasses = {
    primary: 'bg-[#e4007c] text-white hover:bg-[#c6006b] focus:ring-[#e4007c]',
    secondary: 'bg-[#00d4aa] text-white hover:bg-[#00b894] focus:ring-[#00d4aa]',
    outline: 'border-2 border-[#e4007c] text-[#e4007c] hover:bg-[#fef2f9] focus:ring-[#e4007c]',
    ghost: 'text-[#e4007c] hover:bg-[#fef2f9] focus:ring-[#e4007c]',
    success: 'bg-[#10b981] text-white hover:bg-[#059669] focus:ring-[#10b981]',
    warning: 'bg-[#f59e0b] text-white hover:bg-[#d97706] focus:ring-[#f59e0b]',
    error: 'bg-[#ef4444] text-white hover:bg-[#dc2626] focus:ring-[#ef4444]',
    info: 'bg-[#3b82f6] text-white hover:bg-[#2563eb] focus:ring-[#3b82f6]',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
    xl: 'px-8 py-4 text-xl h-14',
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : 'w-auto',
  ];

  return cn(...classes, className);
}

// Input variant utility
export function getInputClasses(
  variant: 'default' | 'success' | 'error' | 'warning' = 'default',
  size: ComponentSize = 'md',
  className?: string
): string {
  const baseClasses = [
    'block w-full rounded-md border',
    'transition-colors duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
  ];

  const variantClasses = {
    default: 'border-gray-300 focus:border-[#e4007c] focus:ring-[#e4007c]',
    success: 'border-[#10b981] focus:border-[#10b981] focus:ring-[#10b981]',
    error: 'border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]',
    warning: 'border-[#f59e0b] focus:border-[#f59e0b] focus:ring-[#f59e0b]',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-3 py-2 text-base h-10',
    lg: 'px-4 py-3 text-lg h-12',
    xl: 'px-5 py-4 text-xl h-14',
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size],
  ];

  return cn(...classes, className);
}

// Card variant utility
export function getCardClasses(
  variant: 'default' | 'elevated' | 'outlined' | 'flat' = 'default',
  padding: 'none' | 'sm' | 'md' | 'lg' = 'md',
  className?: string
): string {
  const baseClasses = ['bg-white rounded-lg transition-shadow duration-200 ease-in-out'];

  const variantClasses = {
    default: 'shadow-md',
    elevated: 'shadow-lg hover:shadow-xl',
    outlined: 'border border-gray-200 shadow-sm',
    flat: 'shadow-none',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
  ];

  return cn(...classes, className);
}

// Alert variant utility
export function getAlertClasses(
  variant: 'info' | 'success' | 'warning' | 'error' = 'info',
  className?: string
): string {
  const baseClasses = ['p-4 rounded-md border-l-4 flex items-start space-x-3'];

  const variantClasses = {
    info: 'bg-[#dbeafe] border-[#3b82f6] text-blue-800',
    success: 'bg-[#d1fae5] border-[#10b981] text-green-800',
    warning: 'bg-[#fef3c7] border-[#f59e0b] text-yellow-800',
    error: 'bg-[#fee2e2] border-[#ef4444] text-red-800',
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant],
  ];

  return cn(...classes, className);
}

// Badge variant utility
export function getBadgeClasses(
  variant: ComponentVariant = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md',
  className?: string
): string {
  const baseClasses = [
    'inline-flex items-center font-medium rounded-full',
    'transition-colors duration-200 ease-in-out',
  ];

  const variantClasses = {
    primary: 'bg-[#fef2f9] text-[#a8005a]',
    secondary: 'bg-[#f0fdf9] text-[#00d4aa]',
    outline: 'border border-[#e4007c] text-[#e4007c] bg-transparent',
    ghost: 'text-[#e4007c] bg-transparent',
    success: 'bg-[#d1fae5] text-green-800',
    warning: 'bg-[#fef3c7] text-yellow-800',
    error: 'bg-[#fee2e2] text-red-800',
    info: 'bg-[#dbeafe] text-blue-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const classes = [
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size],
  ];

  return cn(...classes, className);
}