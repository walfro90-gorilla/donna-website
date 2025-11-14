// lib/utils/index.ts

// Design System Utilities
export * from './designSystem';
export * from './responsive';
export * from './variants';
export * from './accessibility';

// Re-export constants for convenience
export * from '../constants';

// Validation utilities
export * from './validation';

// Registration utilities
export * from './registerRestaurant';

// Common utility functions
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Type utilities
export type { 
  ColorKey, 
  SpacingKey, 
  BorderRadiusKey, 
  ValidationState 
} from './designSystem';

export type { 
  Breakpoint, 
  ResponsiveValue 
} from './responsive';

export type {
  ComponentVariant,
  ComponentSize
} from './variants';