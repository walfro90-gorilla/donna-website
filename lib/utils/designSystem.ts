// lib/utils/designSystem.ts
import { BRAND_COLORS, COMPONENT_VARIANTS, SPACING, BORDER_RADIUS } from '@/lib/constants';

// Type definitions for component variants
export type ComponentSize = typeof COMPONENT_VARIANTS.size[number];
export type ComponentVariant = typeof COMPONENT_VARIANTS.variant[number];
export type ComponentState = typeof COMPONENT_VARIANTS.state[number];

// Utility function to combine class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Generate responsive classes
export function responsive(
  mobile: string,
  tablet?: string,
  desktop?: string,
  wide?: string
): string {
  const classes = [mobile];
  
  if (tablet) classes.push(`md:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  if (wide) classes.push(`xl:${wide}`);
  
  return classes.join(' ');
}

// Color utility functions
export function getColorClasses(
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gray',
  type: 'bg' | 'text' | 'border' = 'bg'
): string {
  const colorMap = {
    primary: {
      bg: 'bg-[#e4007c] hover:bg-[#c6006b]',
      text: 'text-[#e4007c]',
      border: 'border-[#e4007c]',
    },
    secondary: {
      bg: 'bg-[#00d4aa] hover:bg-[#00b894]',
      text: 'text-[#00d4aa]',
      border: 'border-[#00d4aa]',
    },
    success: {
      bg: 'bg-green-500 hover:bg-green-600',
      text: 'text-green-600',
      border: 'border-green-500',
    },
    warning: {
      bg: 'bg-yellow-500 hover:bg-yellow-600',
      text: 'text-yellow-600',
      border: 'border-yellow-500',
    },
    error: {
      bg: 'bg-red-500 hover:bg-red-600',
      text: 'text-red-600',
      border: 'border-red-500',
    },
    info: {
      bg: 'bg-blue-500 hover:bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-500',
    },
    gray: {
      bg: 'bg-gray-500 hover:bg-gray-600',
      text: 'text-gray-600',
      border: 'border-gray-500',
    },
  };

  return colorMap[variant][type];
}

// Size utility functions
export function getSizeClasses(
  size: ComponentSize,
  component: 'button' | 'input' | 'card' | 'text' = 'button'
): string {
  const sizeMap = {
    button: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    },
    input: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
      xl: 'px-6 py-5 text-xl',
    },
    card: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    },
    text: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  };

  return sizeMap[component][size];
}

// Focus ring utility
export function getFocusRing(color: string = '#e4007c'): string {
  return `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${color}]`;
}

// Transition utility
export function getTransition(
  properties: string[] = ['all'],
  duration: 'fast' | 'normal' | 'slow' = 'normal'
): string {
  const durationMap = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
  };

  const props = properties.join(', ');
  return `transition-[${props}] ${durationMap[duration]} ease-in-out`;
}

// Shadow utility
export function getShadow(
  size: 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' = 'base',
  hover: boolean = false
): string {
  const shadowMap = {
    sm: 'shadow-sm',
    base: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  const base = shadowMap[size];
  return hover ? `${base} hover:shadow-lg` : base;
}

// Border radius utility
export function getBorderRadius(
  size: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' = 'base'
): string {
  const radiusMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    base: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  return radiusMap[size];
}

// Animation utility
export function getAnimation(
  type: 'fade-in' | 'slide-in' | 'scale-in' | 'bounce' = 'fade-in',
  duration: 'fast' | 'normal' | 'slow' = 'normal'
): string {
  const animationMap = {
    'fade-in': 'animate-in fade-in-0',
    'slide-in': 'animate-in slide-in-from-bottom-2',
    'scale-in': 'animate-in zoom-in-95',
    'bounce': 'animate-bounce',
  };

  const durationMap = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
  };

  return `${animationMap[type]} ${durationMap[duration]}`;
}

// Accessibility utilities
export function getAccessibilityProps(
  role?: string,
  ariaLabel?: string,
  ariaDescribedBy?: string
): Record<string, string | undefined> {
  return {
    role,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
  };
}

// Responsive grid utility
export function getGridClasses(
  mobile: number = 1,
  tablet?: number,
  desktop?: number,
  wide?: number
): string {
  const classes = [`grid-cols-${mobile}`];
  
  if (tablet) classes.push(`md:grid-cols-${tablet}`);
  if (desktop) classes.push(`lg:grid-cols-${desktop}`);
  if (wide) classes.push(`xl:grid-cols-${wide}`);
  
  return `grid ${classes.join(' ')}`;
}

// Flexbox utility
export function getFlexClasses(
  direction: 'row' | 'col' = 'row',
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' = 'start',
  align: 'start' | 'center' | 'end' | 'stretch' = 'start',
  wrap: boolean = false
): string {
  const directionClass = direction === 'col' ? 'flex-col' : 'flex-row';
  const justifyClass = `justify-${justify}`;
  const alignClass = `items-${align}`;
  const wrapClass = wrap ? 'flex-wrap' : '';
  
  return `flex ${directionClass} ${justifyClass} ${alignClass} ${wrapClass}`.trim();
}