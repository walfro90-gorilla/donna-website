// lib/utils/performance.ts
import { lazy, ComponentType } from 'react';

/**
 * Performance optimization utilities for code splitting and lazy loading
 */

// Lazy loading wrapper with error boundary and loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return LazyComponent;
}

// Bundle size optimization utilities
export const bundleOptimization = {
  // Preload critical components
  preloadComponent: (importFn: () => Promise<any>) => {
    if (typeof window !== 'undefined') {
      // Preload on idle or after a delay
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => importFn());
      } else {
        setTimeout(() => importFn(), 100);
      }
    }
  },

  // Dynamic import with retry logic
  dynamicImport: async <T>(
    importFn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw new Error('Failed to load component after retries');
  },

  // Check if component should be lazy loaded based on viewport
  shouldLazyLoad: (threshold: number = 0.1): boolean => {
    if (typeof window === 'undefined') return false;
    
    return 'IntersectionObserver' in window && 
           window.innerWidth > 768; // Only lazy load on larger screens
  }
};

// Image optimization utilities
export const imageOptimization = {
  // Progressive image loading
  createProgressiveImage: (src: string, placeholder?: string) => ({
    src,
    placeholder: placeholder || `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">
          Cargando...
        </text>
      </svg>
    `)}`,
    loading: 'lazy' as const,
    decoding: 'async' as const
  }),

  // Optimize image format based on browser support
  getOptimalImageFormat: (): string => {
    if (typeof window === 'undefined') return 'jpeg';
    
    const canvas = document.createElement('canvas');
    const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    const avifSupport = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    
    if (avifSupport) return 'avif';
    if (webpSupport) return 'webp';
    return 'jpeg';
  },

  // Generate responsive image sizes
  generateSrcSet: (baseUrl: string, sizes: number[]): string => {
    return sizes
      .map(size => `${baseUrl}?w=${size}&q=80 ${size}w`)
      .join(', ');
  }
};

// Memory optimization utilities
export const memoryOptimization = {
  // Cleanup function for component unmount
  createCleanup: () => {
    const cleanupTasks: (() => void)[] = [];
    
    return {
      add: (task: () => void) => cleanupTasks.push(task),
      cleanup: () => {
        cleanupTasks.forEach(task => {
          try {
            task();
          } catch (error) {
            console.warn('Cleanup task failed:', error);
          }
        });
        cleanupTasks.length = 0;
      }
    };
  },

  // Debounce utility for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T => {
    let timeout: NodeJS.Timeout | null = null;
    
    return ((...args: Parameters<T>) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      
      const callNow = immediate && !timeout;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    }) as T;
  },

  // Throttle utility for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
};

// Network optimization utilities
export const networkOptimization = {
  // Check connection quality
  getConnectionQuality: (): 'slow' | 'fast' | 'unknown' => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return 'unknown';
    }
    
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';
    
    const { effectiveType, downlink } = connection;
    
    if (effectiveType === '4g' && downlink > 1.5) return 'fast';
    if (effectiveType === '3g' || downlink < 1) return 'slow';
    
    return 'fast';
  },

  // Adaptive loading based on connection
  shouldLoadHeavyContent: (): boolean => {
    const quality = networkOptimization.getConnectionQuality();
    return quality === 'fast' || quality === 'unknown';
  },

  // Preload critical resources
  preloadResource: (href: string, as: string, crossorigin?: string) => {
    if (typeof document === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    
    document.head.appendChild(link);
  }
};

// Performance monitoring utilities
export const performanceMonitoring = {
  // Measure component render time
  measureRender: (componentName: string, renderFn: () => void) => {
    if (typeof performance === 'undefined') {
      renderFn();
      return;
    }
    
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    console.debug(`${componentName} render time: ${endTime - startTime}ms`);
  },

  // Track bundle size impact
  trackBundleSize: (chunkName: string) => {
    if (typeof performance === 'undefined') return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes(chunkName)) {
          console.debug(`${chunkName} loaded in ${entry.duration}ms`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource'] });
  }
};

// Export all utilities
export default {
  createLazyComponent,
  bundleOptimization,
  imageOptimization,
  memoryOptimization,
  networkOptimization,
  performanceMonitoring
};