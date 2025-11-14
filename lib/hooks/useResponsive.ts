// lib/hooks/useResponsive.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentBreakpoint, 
  matchesBreakpoint, 
  getWindowWidth,
  type Breakpoint,
  type ResponsiveValue 
} from '@/lib/utils';

// Hook for getting current breakpoint
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | 'base'>('base');

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    // Set initial breakpoint
    updateBreakpoint();

    // Listen for window resize
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Hook for checking if current viewport matches a breakpoint
export function useMediaQuery(breakpoint: Breakpoint) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const updateMatches = () => {
      setMatches(matchesBreakpoint(breakpoint));
    };

    // Set initial state
    updateMatches();

    // Listen for window resize
    window.addEventListener('resize', updateMatches);
    return () => window.removeEventListener('resize', updateMatches);
  }, [breakpoint]);

  return matches;
}

// Hook for getting window dimensions
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateSize();

    // Listen for window resize
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return windowSize;
}

// Hook for resolving responsive values
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T {
  const breakpoint = useBreakpoint();

  if (typeof value !== 'object' || value === null) {
    return value as T;
  }

  const responsiveObj = value as Partial<Record<Breakpoint | 'base', T>>;
  
  // Priority order: current breakpoint -> smaller breakpoints -> base
  const breakpointOrder: (Breakpoint | 'base')[] = ['wide', 'desktop', 'tablet', 'mobile', 'base'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
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

// Hook for mobile detection
export function useIsMobile() {
  const isMobile = !useMediaQuery('tablet');
  return isMobile;
}

// Hook for tablet detection
export function useIsTablet() {
  const isTablet = useMediaQuery('tablet') && !useMediaQuery('desktop');
  return isTablet;
}

// Hook for desktop detection
export function useIsDesktop() {
  const isDesktop = useMediaQuery('desktop');
  return isDesktop;
}

// Hook for touch device detection
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
}

// Hook for orientation detection
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Set initial orientation
    updateOrientation();

    // Listen for orientation change
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

// Hook for responsive grid columns
export function useResponsiveColumns(
  columns: ResponsiveValue<number>,
  minColumnWidth: number = 250
) {
  const windowWidth = useWindowSize().width;
  const responsiveColumns = useResponsiveValue(columns);

  // Calculate optimal columns based on window width and minimum column width
  const optimalColumns = Math.floor(windowWidth / minColumnWidth);
  
  // Use the smaller of responsive columns or optimal columns
  return Math.min(responsiveColumns, optimalColumns) || 1;
}

// Hook for responsive spacing
export function useResponsiveSpacing(spacing: ResponsiveValue<string | number>) {
  return useResponsiveValue(spacing);
}

// Hook for responsive font size
export function useResponsiveFontSize(fontSize: ResponsiveValue<string>) {
  return useResponsiveValue(fontSize);
}

// Hook for container queries (experimental)
export function useContainerQuery(containerRef: React.RefObject<HTMLElement>) {
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  const getContainerBreakpoint = useCallback(() => {
    if (containerWidth >= 1024) return 'desktop';
    if (containerWidth >= 768) return 'tablet';
    if (containerWidth >= 320) return 'mobile';
    return 'base';
  }, [containerWidth]);

  return {
    containerWidth,
    containerBreakpoint: getContainerBreakpoint(),
  };
}

// Hook for responsive image sizing
export function useResponsiveImageSize(
  sizes: ResponsiveValue<{ width: number; height: number }>
) {
  return useResponsiveValue(sizes);
}

// Hook for responsive layout switching
export function useResponsiveLayout<T>(layouts: ResponsiveValue<T>) {
  return useResponsiveValue(layouts);
}

// Hook for managing responsive state
export function useResponsiveState<T>(
  initialValue: ResponsiveValue<T>
) {
  const [value, setValue] = useState<ResponsiveValue<T>>(initialValue);
  const resolvedValue = useResponsiveValue(value);

  const setResponsiveValue = useCallback((newValue: ResponsiveValue<T>) => {
    setValue(newValue);
  }, []);

  return [resolvedValue, setResponsiveValue] as const;
}

// Hook for responsive visibility
export function useResponsiveVisibility(
  visibility: ResponsiveValue<boolean>
) {
  return useResponsiveValue(visibility);
}

// Hook for responsive component props
export function useResponsiveProps<T extends Record<string, any>>(
  props: { [K in keyof T]: ResponsiveValue<T[K]> }
): T {
  const resolvedProps = {} as T;

  for (const [key, value] of Object.entries(props)) {
    resolvedProps[key as keyof T] = useResponsiveValue(value);
  }

  return resolvedProps;
}