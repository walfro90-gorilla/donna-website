// lib/utils/accessibility.ts

import { ACCESSIBILITY } from '@/lib/constants';

// Type definitions for accessibility utilities
export type AriaRole = keyof typeof ACCESSIBILITY.roles;
export type LiveRegion = keyof typeof ACCESSIBILITY.liveRegions;
export type FocusableElement = HTMLElement & { focus(): void };

// Utility to generate ARIA attributes
export function generateAriaAttributes(config: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  hidden?: boolean;
  live?: LiveRegion;
  role?: AriaRole;
  level?: number;
  setSize?: number;
  posInSet?: number;
}): Record<string, string | boolean | number> {
  const attributes: Record<string, string | boolean | number> = {};

  if (config.label) attributes['aria-label'] = config.label;
  if (config.labelledBy) attributes['aria-labelledby'] = config.labelledBy;
  if (config.describedBy) attributes['aria-describedby'] = config.describedBy;
  if (config.expanded !== undefined) attributes['aria-expanded'] = config.expanded;
  if (config.selected !== undefined) attributes['aria-selected'] = config.selected;
  if (config.checked !== undefined) attributes['aria-checked'] = config.checked;
  if (config.disabled !== undefined) attributes['aria-disabled'] = config.disabled;
  if (config.required !== undefined) attributes['aria-required'] = config.required;
  if (config.invalid !== undefined) attributes['aria-invalid'] = config.invalid;
  if (config.hidden !== undefined) attributes['aria-hidden'] = config.hidden;
  if (config.live) attributes['aria-live'] = ACCESSIBILITY.liveRegions[config.live];
  if (config.role) attributes['role'] = ACCESSIBILITY.roles[config.role];
  if (config.level) attributes['aria-level'] = config.level;
  if (config.setSize) attributes['aria-setsize'] = config.setSize;
  if (config.posInSet) attributes['aria-posinset'] = config.posInSet;

  return attributes;
}

// Utility to create screen reader only text
export function createScreenReaderText(text: string): string {
  return `<span class="${ACCESSIBILITY.srOnly}">${text}</span>`;
}

// Utility to generate focus ring classes
export function generateFocusRingClasses(
  color: string = ACCESSIBILITY.focusRing.color,
  width: string = ACCESSIBILITY.focusRing.width,
  offset: string = ACCESSIBILITY.focusRing.offset
): string {
  return `focus:outline-none focus:ring-[${width}] focus:ring-[${color}] focus:ring-offset-[${offset}]`;
}

// Utility to generate skip link classes
export function generateSkipLinkClasses(): string {
  return ACCESSIBILITY.skipLink;
}

// Utility to find all focusable elements within a container
export function getFocusableElements(container: HTMLElement): FocusableElement[] {
  const elements = container.querySelectorAll(ACCESSIBILITY.focusableSelectors);
  return Array.from(elements).filter((element): element is FocusableElement => {
    return element instanceof HTMLElement && !isElementHidden(element);
  });
}

// Utility to check if an element is hidden
export function isElementHidden(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('hidden') ||
    element.getAttribute('aria-hidden') === 'true'
  );
}

// Utility to trap focus within a container
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== ACCESSIBILITY.keyboardShortcuts.tab) return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

// Utility to restore focus to a previously focused element
export function createFocusManager() {
  let previouslyFocusedElement: HTMLElement | null = null;

  return {
    saveFocus: () => {
      previouslyFocusedElement = document.activeElement as HTMLElement;
    },
    restoreFocus: () => {
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
      }
    },
    clearFocus: () => {
      previouslyFocusedElement = null;
    },
  };
}

// Utility to announce messages to screen readers
export function announceToScreenReader(
  message: string,
  priority: LiveRegion = 'polite',
  timeout: number = 1000
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', ACCESSIBILITY.liveRegions[priority]);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = ACCESSIBILITY.srOnly;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, timeout);
}

// Utility to generate heading hierarchy
export function generateHeadingLevel(level: 1 | 2 | 3 | 4 | 5 | 6): {
  tag: string;
  className: string;
  ariaLevel: number;
} {
  const headingStyles = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-medium',
    5: 'text-base font-medium',
    6: 'text-sm font-medium',
  };

  return {
    tag: `h${level}`,
    className: headingStyles[level],
    ariaLevel: level,
  };
}

// Utility to handle keyboard navigation for lists
export function handleListKeyboardNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect?: (index: number) => void,
  orientation: 'vertical' | 'horizontal' = 'vertical'
): number {
  const { key } = event;
  let newIndex = currentIndex;

  const nextKey = orientation === 'vertical' 
    ? ACCESSIBILITY.keyboardShortcuts.arrowDown 
    : ACCESSIBILITY.keyboardShortcuts.arrowRight;
  
  const prevKey = orientation === 'vertical' 
    ? ACCESSIBILITY.keyboardShortcuts.arrowUp 
    : ACCESSIBILITY.keyboardShortcuts.arrowLeft;

  switch (key) {
    case nextKey:
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case prevKey:
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
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
      if (onSelect) onSelect(currentIndex);
      return currentIndex;
  }

  if (newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

// Utility to create accessible form field descriptions
export function createFieldDescription(config: {
  id: string;
  required?: boolean;
  error?: string;
  help?: string;
  characterCount?: { current: number; max: number };
}): {
  describedBy: string;
  descriptionElements: Array<{
    id: string;
    content: string;
    className: string;
  }>;
} {
  const descriptions: Array<{
    id: string;
    content: string;
    className: string;
  }> = [];

  const describedByIds: string[] = [];

  // Required indicator
  if (config.required) {
    const requiredId = `${config.id}-required`;
    descriptions.push({
      id: requiredId,
      content: ACCESSIBILITY.ariaLabels.required,
      className: ACCESSIBILITY.srOnly,
    });
    describedByIds.push(requiredId);
  }

  // Help text
  if (config.help) {
    const helpId = `${config.id}-help`;
    descriptions.push({
      id: helpId,
      content: config.help,
      className: 'text-sm text-gray-600 mt-1',
    });
    describedByIds.push(helpId);
  }

  // Character count
  if (config.characterCount) {
    const countId = `${config.id}-count`;
    const { current, max } = config.characterCount;
    descriptions.push({
      id: countId,
      content: `${current} de ${max} caracteres`,
      className: 'text-xs text-gray-500 mt-1',
    });
    describedByIds.push(countId);
  }

  // Error message
  if (config.error) {
    const errorId = `${config.id}-error`;
    descriptions.push({
      id: errorId,
      content: config.error,
      className: 'text-sm text-red-600 mt-1',
    });
    describedByIds.push(errorId);
  }

  return {
    describedBy: describedByIds.join(' '),
    descriptionElements: descriptions,
  };
}

// Utility to check color contrast ratio (simplified)
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA' | 'fail';
} {
  // This is a simplified implementation
  // In a real application, you would use a proper color contrast calculation library
  const requiredRatio = isLargeText 
    ? ACCESSIBILITY.colorContrast.large 
    : ACCESSIBILITY.colorContrast.normal;

  // Placeholder calculation - replace with actual contrast calculation
  const ratio = 4.5; // This should be calculated based on the actual colors

  return {
    ratio,
    passes: ratio >= requiredRatio,
    level: ratio >= 7 ? 'AAA' : ratio >= requiredRatio ? 'AA' : 'fail',
  };
}

// Utility to create accessible tooltips
export function createAccessibleTooltip(config: {
  triggerId: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}): {
  tooltipId: string;
  triggerProps: Record<string, string>;
  tooltipProps: Record<string, string>;
} {
  const tooltipId = `${config.triggerId}-tooltip`;

  return {
    tooltipId,
    triggerProps: {
      'aria-describedby': tooltipId,
      'aria-expanded': 'false',
    },
    tooltipProps: {
      id: tooltipId,
      role: 'tooltip',
      'aria-hidden': 'true',
    },
  };
}

// Utility for accessible form validation
export function createAccessibleValidation(config: {
  fieldId: string;
  isValid: boolean;
  errorMessage?: string;
  successMessage?: string;
}): {
  fieldProps: Record<string, string | boolean>;
  messageProps?: Record<string, string>;
  messageContent?: string;
} {
  const messageId = `${config.fieldId}-validation`;
  
  const fieldProps: Record<string, string | boolean> = {
    'aria-invalid': !config.isValid,
  };

  if (!config.isValid && config.errorMessage) {
    fieldProps['aria-describedby'] = messageId;
    return {
      fieldProps,
      messageProps: {
        id: messageId,
        role: 'alert',
        'aria-live': 'polite',
      },
      messageContent: config.errorMessage,
    };
  }

  if (config.isValid && config.successMessage) {
    fieldProps['aria-describedby'] = messageId;
    return {
      fieldProps,
      messageProps: {
        id: messageId,
        role: 'status',
        'aria-live': 'polite',
      },
      messageContent: config.successMessage,
    };
  }

  return { fieldProps };
}