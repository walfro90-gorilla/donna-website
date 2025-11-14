// lib/utils/designSystem.ts

import { 
  BRAND_COLORS, 
  SPACING, 
  BORDER_RADIUS, 
  COMPONENT_SIZES, 
  RESPONSIVE_UTILITIES,
  SHADOWS
} from '@/lib/constants';

// Type definitions for design system utilities
export type ColorKey = keyof typeof BRAND_COLORS;
export type SpacingKey = keyof typeof SPACING;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'info';
export type ValidationState = 'default' | 'valid' | 'invalid' | 'warning';

// Utility function to get color values
export function getColor(color: string): string {
  // Handle nested color objects (like gray.500)
  if (color.includes('.')) {
    const [colorName, shade] = color.split('.');
    const colorObj = BRAND_COLORS[colorName as keyof typeof BRAND_COLORS];
    if (typeof colorObj === 'object' && colorObj !== null) {
      return (colorObj as Record<string, string>)[shade] || color;
    }
  }
  
  // Handle direct color access
  return (BRAND_COLORS as Record<string, any>)[color] || color;
}

// Utility function to get spacing values
export function getSpacing(space: SpacingKey | number): string {
  if (typeof space === 'number') {
    return `${space * 0.25}rem`; // Convert to rem based on 4px grid
  }
  return SPACING[space] || String(space);
}

// Utility function to generate responsive classes
export function responsive(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([breakpoint, style]) => {
      if (breakpoint === 'base') return style;
      return `${breakpoint}:${style}`;
    })
    .join(' ');
}

// Utility function to generate component size classes
export function getComponentSize(component: keyof typeof COMPONENT_SIZES, size: ComponentSize): Record<string, string> {
  const componentSizes = COMPONENT_SIZES[component];
  if (!componentSizes) {
    return {};
  }
  
  // Type assertion to handle the union type
  const sizeConfig = (componentSizes as any)[size];
  if (!sizeConfig) {
    return {};
  }
  
  return sizeConfig;
}

// Utility function to generate button variant classes
export function getButtonVariant(variant: ComponentVariant, size: ComponentSize = 'md'): string {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-md',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
    xl: 'px-8 py-4 text-xl h-14',
  };

  const variantClasses = {
    primary: `bg-[${BRAND_COLORS.primary}] text-white hover:bg-[${BRAND_COLORS.primaryHover}] focus:ring-[${BRAND_COLORS.primary}]`,
    secondary: `bg-[${BRAND_COLORS.secondary}] text-white hover:bg-[${BRAND_COLORS.secondaryHover}] focus:ring-[${BRAND_COLORS.secondary}]`,
    outline: `border-2 border-[${BRAND_COLORS.primary}] text-[${BRAND_COLORS.primary}] hover:bg-[${BRAND_COLORS.primaryLight}] focus:ring-[${BRAND_COLORS.primary}]`,
    ghost: `text-[${BRAND_COLORS.primary}] hover:bg-[${BRAND_COLORS.primaryLight}] focus:ring-[${BRAND_COLORS.primary}]`,
    success: `bg-[${BRAND_COLORS.success}] text-white hover:bg-[${BRAND_COLORS.successHover}] focus:ring-[${BRAND_COLORS.success}]`,
    warning: `bg-[${BRAND_COLORS.warning}] text-white hover:bg-[${BRAND_COLORS.warningHover}] focus:ring-[${BRAND_COLORS.warning}]`,
    error: `bg-[${BRAND_COLORS.error}] text-white hover:bg-[${BRAND_COLORS.errorHover}] focus:ring-[${BRAND_COLORS.error}]`,
    info: `bg-[${BRAND_COLORS.info}] text-white hover:bg-[${BRAND_COLORS.infoHover}] focus:ring-[${BRAND_COLORS.info}]`,
  };

  return [...baseClasses, sizeClasses[size], variantClasses[variant]].join(' ');
}

// Utility function to generate input variant classes
export function getInputVariant(state: ValidationState = 'default', size: ComponentSize = 'md'): string {
  const baseClasses = [
    'block w-full rounded-md border',
    'transition-colors duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
  ];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-3 py-2 text-base h-10',
    lg: 'px-4 py-3 text-lg h-12',
    xl: 'px-5 py-4 text-xl h-14',
  };

  const stateClasses = {
    default: `border-gray-300 focus:border-[${BRAND_COLORS.primary}] focus:ring-[${BRAND_COLORS.primary}]`,
    valid: `border-[${BRAND_COLORS.success}] focus:border-[${BRAND_COLORS.success}] focus:ring-[${BRAND_COLORS.success}]`,
    invalid: `border-[${BRAND_COLORS.error}] focus:border-[${BRAND_COLORS.error}] focus:ring-[${BRAND_COLORS.error}]`,
    warning: `border-[${BRAND_COLORS.warning}] focus:border-[${BRAND_COLORS.warning}] focus:ring-[${BRAND_COLORS.warning}]`,
  };

  return [...baseClasses, sizeClasses[size], stateClasses[state]].join(' ');
}

// Utility function to generate card variant classes
export function getCardVariant(variant: 'default' | 'elevated' | 'outlined' = 'default'): string {
  const baseClasses = [
    'bg-white rounded-lg',
    'transition-shadow duration-200 ease-in-out',
  ];

  const variantClasses = {
    default: `shadow-${SHADOWS.base}`,
    elevated: `shadow-${SHADOWS.lg} hover:shadow-${SHADOWS.xl}`,
    outlined: `border border-gray-200 shadow-${SHADOWS.sm}`,
  };

  return [...baseClasses, variantClasses[variant]].join(' ');
}

// Utility function to generate alert variant classes
export function getAlertVariant(variant: 'info' | 'success' | 'warning' | 'error'): string {
  const baseClasses = [
    'p-4 rounded-md border-l-4',
    'flex items-start space-x-3',
  ];

  const variantClasses = {
    info: `bg-[${BRAND_COLORS.infoLight}] border-[${BRAND_COLORS.info}] text-blue-800`,
    success: `bg-[${BRAND_COLORS.successLight}] border-[${BRAND_COLORS.success}] text-green-800`,
    warning: `bg-[${BRAND_COLORS.warningLight}] border-[${BRAND_COLORS.warning}] text-yellow-800`,
    error: `bg-[${BRAND_COLORS.errorLight}] border-[${BRAND_COLORS.error}] text-red-800`,
  };

  return [...baseClasses, variantClasses[variant]].join(' ');
}

// Utility function to generate badge variant classes
export function getBadgeVariant(variant: ComponentVariant, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const baseClasses = [
    'inline-flex items-center font-medium rounded-full',
    'transition-colors duration-200 ease-in-out',
  ];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const variantClasses = {
    primary: `bg-[${BRAND_COLORS.primaryLight}] text-[${BRAND_COLORS.primaryDark}]`,
    secondary: `bg-[${BRAND_COLORS.secondaryLight}] text-[${BRAND_COLORS.secondary}]`,
    outline: `border border-[${BRAND_COLORS.primary}] text-[${BRAND_COLORS.primary}]`,
    ghost: `text-[${BRAND_COLORS.primary}]`,
    success: `bg-[${BRAND_COLORS.successLight}] text-green-800`,
    warning: `bg-[${BRAND_COLORS.warningLight}] text-yellow-800`,
    error: `bg-[${BRAND_COLORS.errorLight}] text-red-800`,
    info: `bg-[${BRAND_COLORS.infoLight}] text-blue-800`,
  };

  return [...baseClasses, sizeClasses[size], variantClasses[variant]].join(' ');
}

// Utility function to generate grid classes
export function getGridClasses(cols: number, gap: SpacingKey = 6): string {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapClass = `gap-${gap}`;
  const colClass = gridCols[cols as keyof typeof gridCols] || `grid-cols-${cols}`;

  return `grid ${colClass} ${gapClass}`;
}

// Utility function to generate responsive grid classes
export function getResponsiveGrid(breakpoints: Record<string, number>, gap: SpacingKey = 6): string {
  const classes = ['grid', `gap-${gap}`];
  
  Object.entries(breakpoints).forEach(([breakpoint, cols]) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    };
    
    const colClass = gridCols[cols as keyof typeof gridCols] || `grid-cols-${cols}`;
    
    if (breakpoint === 'base') {
      classes.push(colClass);
    } else {
      classes.push(`${breakpoint}:${colClass}`);
    }
  });

  return classes.join(' ');
}

// Utility function to generate container classes
export function getContainerClasses(size: keyof typeof RESPONSIVE_UTILITIES.containers = 'xl'): string {
  const maxWidth = RESPONSIVE_UTILITIES.containers[size];
  return `container mx-auto px-4 sm:px-6 lg:px-8 max-w-[${maxWidth}]`;
}

// Utility function to generate focus ring classes
export function getFocusRing(color: string = BRAND_COLORS.primary): string {
  return `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${color}]`;
}

// Utility function to generate transition classes
export function getTransition(properties: string[] = ['all'], duration: keyof typeof import('@/lib/constants').ANIMATIONS = 'normal'): string {
  const transitionProperties = properties.join(', ');
  return `transition-[${transitionProperties}] duration-200 ease-in-out`;
}

// Utility function to combine class names (similar to clsx)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Utility function to generate truncate text classes
export function getTruncateClasses(lines: number = 1): string {
  if (lines === 1) {
    return 'truncate';
  }
  return `line-clamp-${lines}`;
}

// Utility function to generate aspect ratio classes
export function getAspectRatio(ratio: 'square' | 'video' | 'photo' | string): string {
  const ratios = {
    square: 'aspect-square',
    video: 'aspect-video',
    photo: 'aspect-[4/3]',
  };
  
  return ratios[ratio as keyof typeof ratios] || `aspect-[${ratio}]`;
}