// lib/utils/responsive.ts

import { BREAKPOINTS, RESPONSIVE_UTILITIES } from '@/lib/constants';

// Enhanced responsive utilities for mobile-first design

// Type definitions for responsive utilities
export type Breakpoint = keyof typeof BREAKPOINTS;
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint | 'base', T>>;

// Utility to check if we're on the client side
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

// Utility to get current window width
export function getWindowWidth(): number {
  if (!isClient()) return 0;
  return window.innerWidth;
}

// Utility to get current breakpoint
export function getCurrentBreakpoint(): Breakpoint | 'base' {
  if (!isClient()) return 'base';
  
  const width = getWindowWidth();
  
  if (width >= parseInt(BREAKPOINTS.wide)) return 'wide';
  if (width >= parseInt(BREAKPOINTS.desktop)) return 'desktop';
  if (width >= parseInt(BREAKPOINTS.tablet)) return 'tablet';
  if (width >= parseInt(BREAKPOINTS.mobile)) return 'mobile';
  
  return 'base';
}

// Utility to check if current viewport matches breakpoint
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (!isClient()) return false;
  
  const width = getWindowWidth();
  const breakpointValue = parseInt(BREAKPOINTS[breakpoint]);
  
  return width >= breakpointValue;
}

// Utility to resolve responsive values
export function resolveResponsiveValue<T>(
  value: ResponsiveValue<T>,
  currentBreakpoint?: Breakpoint | 'base'
): T {
  if (typeof value !== 'object' || value === null) {
    return value as T;
  }
  
  const bp = currentBreakpoint || getCurrentBreakpoint();
  const responsiveObj = value as Partial<Record<Breakpoint | 'base', T>>;
  
  // Priority order: current breakpoint -> smaller breakpoints -> base
  const breakpointOrder: (Breakpoint | 'base')[] = ['wide', 'desktop', 'tablet', 'mobile', 'base'];
  const currentIndex = breakpointOrder.indexOf(bp);
  
  // Look for value at current breakpoint or smaller
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const key = breakpointOrder[i];
    if (responsiveObj[key] !== undefined) {
      return responsiveObj[key] as T;
    }
  }
  
  // Fallback to any available value
  return (responsiveObj.base || Object.values(responsiveObj)[0]) as T;
}

// Utility to generate responsive CSS classes
export function generateResponsiveClasses<T extends string>(
  value: ResponsiveValue<T>,
  prefix: string = ''
): string {
  if (typeof value !== 'object' || value === null) {
    return prefix ? `${prefix}${value}` : value as string;
  }
  
  const responsiveObj = value as Partial<Record<Breakpoint | 'base', T>>;
  const classes: string[] = [];
  
  Object.entries(responsiveObj).forEach(([breakpoint, val]) => {
    if (val === undefined) return;
    
    const className = prefix ? `${prefix}${val}` : val;
    
    if (breakpoint === 'base') {
      classes.push(className);
    } else {
      // Map breakpoint names to Tailwind prefixes
      const breakpointMap: Record<string, string> = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      };
      
      const tailwindPrefix = breakpointMap[breakpoint] || breakpoint;
      classes.push(`${tailwindPrefix}:${className}`);
    }
  });
  
  return classes.join(' ');
}

// Hook-like utility for responsive values (can be used in components)
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T {
  return resolveResponsiveValue(value);
}

// Utility to create media query strings
export function createMediaQuery(breakpoint: Breakpoint, type: 'min' | 'max' = 'min'): string {
  const width = BREAKPOINTS[breakpoint];
  return `(${type}-width: ${width})`;
}

// Utility to generate responsive padding/margin classes
export function generateSpacingClasses(
  property: 'p' | 'm' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr' | 'mx' | 'my' | 'mt' | 'mb' | 'ml' | 'mr',
  value: ResponsiveValue<string>
): string {
  return generateResponsiveClasses(value, `${property}-`);
}

// Utility to generate responsive text size classes
export function generateTextClasses(
  size: ResponsiveValue<'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'>
): string {
  return generateResponsiveClasses(size, 'text-');
}

// Utility to generate responsive grid column classes
export function generateGridClasses(
  cols: ResponsiveValue<string>
): string {
  return generateResponsiveClasses(cols, 'grid-cols-');
}

// Utility to generate responsive flex direction classes
export function generateFlexClasses(
  direction: ResponsiveValue<'row' | 'col' | 'row-reverse' | 'col-reverse'>
): string {
  return generateResponsiveClasses(direction, 'flex-');
}

// Utility to generate responsive width classes
export function generateWidthClasses(
  width: ResponsiveValue<string>
): string {
  return generateResponsiveClasses(width, 'w-');
}

// Utility to generate responsive height classes
export function generateHeightClasses(
  height: ResponsiveValue<string>
): string {
  return generateResponsiveClasses(height, 'h-');
}

// Utility for responsive visibility
export function generateVisibilityClasses(
  visibility: ResponsiveValue<'block' | 'hidden' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid'>
): string {
  if (typeof visibility !== 'object' || visibility === null) {
    return visibility as string;
  }
  
  const responsiveObj = visibility as Partial<Record<Breakpoint | 'base', string>>;
  const classes: string[] = [];
  
  Object.entries(responsiveObj).forEach(([breakpoint, val]) => {
    if (val === undefined) return;
    
    if (breakpoint === 'base') {
      classes.push(val === 'hidden' ? 'hidden' : val);
    } else {
      const breakpointMap: Record<string, string> = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      };
      
      const tailwindPrefix = breakpointMap[breakpoint] || breakpoint;
      classes.push(`${tailwindPrefix}:${val === 'hidden' ? 'hidden' : val}`);
    }
  });
  
  return classes.join(' ');
}

// Utility to create responsive container
export function createResponsiveContainer(
  maxWidths: ResponsiveValue<keyof typeof RESPONSIVE_UTILITIES.containers> = 'xl'
): string {
  const baseClasses = ['container', 'mx-auto', 'px-4'];
  
  if (typeof maxWidths === 'string') {
    const maxWidth = RESPONSIVE_UTILITIES.containers[maxWidths];
    return [...baseClasses, `max-w-[${maxWidth}]`].join(' ');
  }
  
  const responsiveMaxWidths = maxWidths as Partial<Record<Breakpoint | 'base', keyof typeof RESPONSIVE_UTILITIES.containers>>;
  const maxWidthClasses: string[] = [];
  
  Object.entries(responsiveMaxWidths).forEach(([breakpoint, size]) => {
    if (!size) return;
    
    const maxWidth = RESPONSIVE_UTILITIES.containers[size];
    
    if (breakpoint === 'base') {
      maxWidthClasses.push(`max-w-[${maxWidth}]`);
    } else {
      const breakpointMap: Record<string, string> = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      };
      
      const tailwindPrefix = breakpointMap[breakpoint] || breakpoint;
      maxWidthClasses.push(`${tailwindPrefix}:max-w-[${maxWidth}]`);
    }
  });
  
  return [...baseClasses, ...maxWidthClasses].join(' ');
}

// Utility to handle responsive images
export function generateImageClasses(
  objectFit: ResponsiveValue<'contain' | 'cover' | 'fill' | 'none' | 'scale-down'> = 'cover'
): string {
  return generateResponsiveClasses(objectFit, 'object-');
}

// Utility for responsive aspect ratios
export function generateAspectRatioClasses(
  ratio: ResponsiveValue<'square' | 'video' | 'photo' | string>
): string {
  if (typeof ratio !== 'object' || ratio === null) {
    const ratios = {
      square: 'aspect-square',
      video: 'aspect-video',
      photo: 'aspect-[4/3]',
    };
    return ratios[ratio as keyof typeof ratios] || `aspect-[${ratio}]`;
  }
  
  const responsiveObj = ratio as Partial<Record<Breakpoint | 'base', string>>;
  const classes: string[] = [];
  
  Object.entries(responsiveObj).forEach(([breakpoint, val]) => {
    if (val === undefined) return;
    
    const ratios = {
      square: 'aspect-square',
      video: 'aspect-video',
      photo: 'aspect-[4/3]',
    };
    
    const aspectClass = ratios[val as keyof typeof ratios] || `aspect-[${val}]`;
    
    if (breakpoint === 'base') {
      classes.push(aspectClass);
    } else {
      const breakpointMap: Record<string, string> = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      };
      
      const tailwindPrefix = breakpointMap[breakpoint] || breakpoint;
      classes.push(`${tailwindPrefix}:${aspectClass}`);
    }
  });
  
  return classes.join(' ');
}

// Enhanced touch-friendly utilities for mobile
export function generateTouchFriendlyClasses(
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const touchSizes = {
    sm: 'min-h-[40px] min-w-[40px]', // 40px minimum touch target
    md: 'min-h-[44px] min-w-[44px]', // 44px recommended touch target
    lg: 'min-h-[48px] min-w-[48px]', // 48px large touch target
  };
  
  return `${touchSizes[size]} touch-manipulation select-none`;
}

// Utility for responsive font sizes with mobile-first approach
export function generateResponsiveFontClasses(
  sizes: ResponsiveValue<'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'>
): string {
  if (typeof sizes !== 'object' || sizes === null) {
    return `text-${sizes}`;
  }
  
  const responsiveObj = sizes as Partial<Record<Breakpoint | 'base', string>>;
  const classes: string[] = [];
  
  // Mobile-first approach: base size first, then larger breakpoints
  if (responsiveObj.base) {
    classes.push(`text-${responsiveObj.base}`);
  }
  
  // Add responsive classes in mobile-first order
  const breakpointOrder: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
  breakpointOrder.forEach(breakpoint => {
    if (responsiveObj[breakpoint]) {
      const tailwindPrefix = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      }[breakpoint];
      
      classes.push(`${tailwindPrefix}:text-${responsiveObj[breakpoint]}`);
    }
  });
  
  return classes.join(' ');
}

// Utility for responsive spacing with mobile-first approach
export function generateResponsiveSpacingClasses(
  property: 'p' | 'm' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr' | 'mx' | 'my' | 'mt' | 'mb' | 'ml' | 'mr',
  values: ResponsiveValue<string | number>
): string {
  if (typeof values !== 'object' || values === null) {
    return `${property}-${values}`;
  }
  
  const responsiveObj = values as Partial<Record<Breakpoint | 'base', string | number>>;
  const classes: string[] = [];
  
  // Mobile-first approach
  if (responsiveObj.base !== undefined) {
    classes.push(`${property}-${responsiveObj.base}`);
  }
  
  const breakpointOrder: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
  breakpointOrder.forEach(breakpoint => {
    if (responsiveObj[breakpoint] !== undefined) {
      const tailwindPrefix = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      }[breakpoint];
      
      classes.push(`${tailwindPrefix}:${property}-${responsiveObj[breakpoint]}`);
    }
  });
  
  return classes.join(' ');
}

// Utility for responsive layout switching (flex to grid, etc.)
export function generateResponsiveLayoutClasses(
  layouts: ResponsiveValue<'flex' | 'grid' | 'block' | 'inline-block' | 'hidden'>
): string {
  if (typeof layouts !== 'object' || layouts === null) {
    return layouts as string;
  }
  
  const responsiveObj = layouts as Partial<Record<Breakpoint | 'base', string>>;
  const classes: string[] = [];
  
  if (responsiveObj.base) {
    classes.push(responsiveObj.base);
  }
  
  const breakpointOrder: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
  breakpointOrder.forEach(breakpoint => {
    if (responsiveObj[breakpoint]) {
      const tailwindPrefix = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      }[breakpoint];
      
      classes.push(`${tailwindPrefix}:${responsiveObj[breakpoint]}`);
    }
  });
  
  return classes.join(' ');
}

// Utility for responsive component sizing
export function generateResponsiveComponentSizes(
  component: 'button' | 'input' | 'card',
  sizes: ResponsiveValue<'sm' | 'md' | 'lg' | 'xl'>
): string {
  const componentSizeMap = {
    button: {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-6 py-3 text-lg h-12',
      xl: 'px-8 py-4 text-xl h-14',
    },
    input: {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-3 py-2 text-base h-10',
      lg: 'px-4 py-3 text-lg h-12',
      xl: 'px-5 py-4 text-xl h-14',
    },
    card: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    },
  };
  
  if (typeof sizes !== 'object' || sizes === null) {
    return componentSizeMap[component][sizes as keyof typeof componentSizeMap[typeof component]] || '';
  }
  
  const responsiveObj = sizes as Partial<Record<Breakpoint | 'base', 'sm' | 'md' | 'lg' | 'xl'>>;
  const classes: string[] = [];
  
  if (responsiveObj.base) {
    const sizeClasses = componentSizeMap[component][responsiveObj.base];
    if (sizeClasses) classes.push(sizeClasses);
  }
  
  const breakpointOrder: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
  breakpointOrder.forEach(breakpoint => {
    if (responsiveObj[breakpoint]) {
      const tailwindPrefix = {
        mobile: 'sm',
        tablet: 'md',
        desktop: 'lg',
        wide: 'xl',
      }[breakpoint];
      
      const sizeClasses = componentSizeMap[component][responsiveObj[breakpoint]!];
      if (sizeClasses) {
        // Split size classes and add breakpoint prefix to each
        const individualClasses = sizeClasses.split(' ');
        individualClasses.forEach(cls => {
          classes.push(`${tailwindPrefix}:${cls}`);
        });
      }
    }
  });
  
  return classes.join(' ');
}

// Utility for mobile-first responsive design patterns
export function createMobileFirstClasses(config: {
  base: string;
  mobile?: string;
  tablet?: string;
  desktop?: string;
  wide?: string;
}): string {
  const classes = [config.base];
  
  if (config.mobile) classes.push(`sm:${config.mobile}`);
  if (config.tablet) classes.push(`md:${config.tablet}`);
  if (config.desktop) classes.push(`lg:${config.desktop}`);
  if (config.wide) classes.push(`xl:${config.wide}`);
  
  return classes.join(' ');
}

// Utility for responsive safe areas (notches, etc.)
export function generateSafeAreaClasses(): string {
  return 'pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right';
}

// Utility for responsive orientation handling
export function generateOrientationClasses(
  portrait: string,
  landscape: string
): string {
  return `portrait:${portrait} landscape:${landscape}`;
}