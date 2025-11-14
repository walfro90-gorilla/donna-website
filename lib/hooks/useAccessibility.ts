// lib/hooks/useAccessibility.ts
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { 
  createFocusManager, 
  trapFocus, 
  announceToScreenReader,
  getFocusableElements,
  ACCESSIBILITY 
} from '@/lib/utils';

// Hook for managing focus within a component
export function useFocusManagement() {
  const focusManager = useRef(createFocusManager());

  const saveFocus = useCallback(() => {
    focusManager.current.saveFocus();
  }, []);

  const restoreFocus = useCallback(() => {
    focusManager.current.restoreFocus();
  }, []);

  const clearFocus = useCallback(() => {
    focusManager.current.clearFocus();
  }, []);

  return { saveFocus, restoreFocus, clearFocus };
}

// Hook for managing focus trap within a container
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isActive && containerRef.current && event.key === ACCESSIBILITY.keyboardShortcuts.tab) {
      trapFocus(containerRef.current, event);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);

  return containerRef;
}

// Hook for keyboard navigation in lists
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  orientation: 'vertical' | 'horizontal' = 'vertical',
  onSelect?: (index: number) => void
) {
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return;

    const { key } = event;
    let newIndex = currentIndexRef.current;

    const nextKey = orientation === 'vertical' 
      ? ACCESSIBILITY.keyboardShortcuts.arrowDown 
      : ACCESSIBILITY.keyboardShortcuts.arrowRight;
    
    const prevKey = orientation === 'vertical' 
      ? ACCESSIBILITY.keyboardShortcuts.arrowUp 
      : ACCESSIBILITY.keyboardShortcuts.arrowLeft;

    switch (key) {
      case nextKey:
        event.preventDefault();
        newIndex = currentIndexRef.current < items.length - 1 ? currentIndexRef.current + 1 : 0;
        break;
      case prevKey:
        event.preventDefault();
        newIndex = currentIndexRef.current > 0 ? currentIndexRef.current - 1 : items.length - 1;
        break;
      case ACCESSIBILITY.keyboardShortcuts.home:
        event.preventDefault();
        newIndex = 0;
        break;
      case ACCESSIBILITY.keyboardShortcuts.end:
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      case ACCESSIBILITY.keyboardShortcuts.enter:
      case ACCESSIBILITY.keyboardShortcuts.space:
        event.preventDefault();
        if (onSelect) onSelect(currentIndexRef.current);
        return;
    }

    if (newIndex !== currentIndexRef.current && items[newIndex]) {
      items[newIndex].focus();
      currentIndexRef.current = newIndex;
    }
  }, [items, orientation, onSelect]);

  const setCurrentIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      currentIndexRef.current = index;
      items[index]?.focus();
    }
  }, [items]);

  return {
    currentIndex: currentIndexRef.current,
    setCurrentIndex,
    handleKeyDown,
  };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const announce = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
    timeout?: number
  ) => {
    announceToScreenReader(message, priority, timeout);
  }, []);

  const announceError = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceLoading = useCallback((message: string = ACCESSIBILITY.ariaLabels.loading) => {
    announce(message, 'polite');
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
  };
}

// Hook for managing ARIA live regions
export function useLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const updateLiveRegion = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const clearLiveRegion = useCallback(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  }, []);

  return {
    liveRegionRef,
    updateLiveRegion,
    clearLiveRegion,
  };
}

// Hook for managing modal accessibility
export function useModalAccessibility(isOpen: boolean) {
  const { saveFocus, restoreFocus } = useFocusManagement();
  const modalRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      
      // Focus the modal after a brief delay
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = getFocusableElements(modalRef.current);
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      
      // Restore focus
      restoreFocus();
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, saveFocus, restoreFocus, modalRef]);

  return modalRef;
}

// Hook for managing form accessibility
export function useFormAccessibility() {
  const { announce } = useScreenReader();

  const announceValidationError = useCallback((fieldName: string, error: string) => {
    announce(`Error en ${fieldName}: ${error}`, 'assertive');
  }, [announce]);

  const announceValidationSuccess = useCallback((fieldName: string) => {
    announce(`${fieldName} es válido`, 'polite');
  }, [announce]);

  const announceFormSubmission = useCallback((isSubmitting: boolean) => {
    if (isSubmitting) {
      announce('Enviando formulario...', 'polite');
    }
  }, [announce]);

  const announceFormCompletion = useCallback((success: boolean, message?: string) => {
    if (success) {
      announce(message || 'Formulario enviado exitosamente', 'polite');
    } else {
      announce(message || 'Error al enviar el formulario', 'assertive');
    }
  }, [announce]);

  return {
    announceValidationError,
    announceValidationSuccess,
    announceFormSubmission,
    announceFormCompletion,
  };
}

// Hook for managing skip links
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  const addSkipLink = useCallback((target: string, label: string) => {
    if (skipLinksRef.current) {
      const link = document.createElement('a');
      link.href = `#${target}`;
      link.textContent = label;
      link.className = ACCESSIBILITY.skipLink;
      skipLinksRef.current.appendChild(link);
    }
  }, []);

  const clearSkipLinks = useCallback(() => {
    if (skipLinksRef.current) {
      skipLinksRef.current.innerHTML = '';
    }
  }, []);

  return {
    skipLinksRef,
    addSkipLink,
    clearSkipLinks,
  };
}

// Hook for managing reduced motion preferences
export function useReducedMotion() {
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    const handleChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion.current = event.matches;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion.current;
}

// Hook for managing high contrast preferences
export function useHighContrast() {
  const prefersHighContrast = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    prefersHighContrast.current = mediaQuery.matches;

    const handleChange = (event: MediaQueryListEvent) => {
      prefersHighContrast.current = event.matches;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast.current;
}

// Hook for managing color scheme preferences
export function useColorScheme() {
  const prefersDarkMode = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkMode.current = mediaQuery.matches;

    const handleChange = (event: MediaQueryListEvent) => {
      prefersDarkMode.current = event.matches;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    isDarkMode: prefersDarkMode.current,
    isLightMode: !prefersDarkMode.current,
  };
}