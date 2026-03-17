import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateFocusRingClasses(color?: string) {
  // If color is provided, we could use it to customize the ring color,
  // but for now we'll stick to standard tailwind classes or use a style attribute if needed.
  // For simplicity and consistency with shadcn/ui, we use ring-ring.
  return "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
}

export function generateAriaAttributes({
  label,
  labelledBy,
  describedBy,
  role,
  expanded,
}: {
  label?: string
  labelledBy?: string
  describedBy?: string
  role?: string
  expanded?: boolean
}) {
  return {
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-expanded": expanded,
    role,
  }
}

export type ResponsiveValue<T> = {
  base?: T;
  mobile?: T;
  tablet?: T;
  desktop?: T;
};

export function generateResponsiveComponentSizes(
  component: string,
  sizes: string | { base?: string; mobile?: string; tablet?: string; desktop?: string }
) {
  // Simplified implementation to prevent crashes.
  // Ideally this would return classes based on the component and size.
  // If sizes is a string, it's a fixed size. If object, it's responsive.

  // For now, return empty string or basic padding if we wanted to be fancy, 
  // but empty string is safest to avoid conflicts with existing classes.
  return ""
}

export function generateTouchFriendlyClasses(size: string = 'md') {
  // Returns classes to ensure touch targets are large enough on mobile
  return "touch-manipulation"
}

export const ACCESSIBILITY = {
  ariaLabels: {
    loading: "Cargando...",
    close: "Cerrar",
    menu: "Menú",
    search: "Buscar",
    required: "Requerido",
    previous: "Anterior",
    next: "Siguiente",
  },
  keyboardShortcuts: {
    tab: 'Tab',
    enter: 'Enter',
    space: ' ',
    arrowUp: 'ArrowUp',
    arrowDown: 'ArrowDown',
    arrowLeft: 'ArrowLeft',
    arrowRight: 'ArrowRight',
    home: 'Home',
    end: 'End',
    escape: 'Escape',
  },
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:border focus:border-gray-300 focus:rounded',
};

export function generateResponsiveFontClasses(sizes: { base?: string; mobile?: string; tablet?: string; desktop?: string }) {
  // Simple implementation mapping sizes to tailwind classes
  const classes = [];
  if (sizes.base) classes.push(`text-${sizes.base}`);
  if (sizes.mobile) classes.push(`sm:text-${sizes.mobile}`);
  if (sizes.tablet) classes.push(`md:text-${sizes.tablet}`);
  if (sizes.desktop) classes.push(`lg:text-${sizes.desktop}`);
  return classes.join(' ');
}

export function generateResponsiveSpacingClasses(property: 'p' | 'm' | 'gap' | 'px' | 'py' | 'mx' | 'my' | 'mb' | 'mt' | 'ml' | 'mr' | 'pb' | 'pt' | 'pl' | 'pr', sizes: { base?: string; mobile?: string; tablet?: string; desktop?: string }) {
  const classes = [];
  if (sizes.base) classes.push(`${property}-${sizes.base}`);
  if (sizes.mobile) classes.push(`sm:${property}-${sizes.mobile}`);
  if (sizes.tablet) classes.push(`md:${property}-${sizes.tablet}`);
  if (sizes.desktop) classes.push(`lg:${property}-${sizes.desktop}`);
  return classes.join(' ');
}

export function trapFocus(element: HTMLElement, event?: KeyboardEvent | React.KeyboardEvent) {
  // Placeholder for focus trapping logic
  // In a real implementation, this would restrict tab navigation to the element
  console.log('Focus trapped in', element);
}

export function createFieldDescription(opts: { id: string; required?: boolean; error?: string; help?: string; characterCount?: { current: number; max: number } | undefined } | string, id?: string) {
  // Helper to create aria-describedby props
  if (typeof opts === 'string') {
    return { id: id || '', children: opts, describedBy: id || '', descriptionElements: [] as Array<{ id: string; className: string; content: string }> };
  }
  const elements: Array<{ id: string; className: string; content: string }> = [];
  const describedByParts: string[] = [];
  if (opts.error) {
    const errId = `${opts.id}-error`;
    elements.push({ id: errId, className: 'text-red-600 text-sm mt-1', content: opts.error });
    describedByParts.push(errId);
  }
  if (opts.help) {
    const helpId = `${opts.id}-help`;
    elements.push({ id: helpId, className: 'text-gray-500 text-sm mt-1', content: opts.help });
    describedByParts.push(helpId);
  }
  if (opts.characterCount) {
    const ccId = `${opts.id}-charcount`;
    elements.push({ id: ccId, className: 'text-gray-400 text-xs mt-1', content: `${opts.characterCount.current}/${opts.characterCount.max}` });
    describedByParts.push(ccId);
  }
  return {
    id: opts.id,
    children: opts.help || '',
    describedBy: describedByParts.join(' '),
    descriptionElements: elements,
  };
}

export function announceToScreenReader(message: string, priority?: 'polite' | 'assertive', timeout?: number) {
  // Simple implementation using a live region if it existed, or just logging for now
  // In a real app, you'd append a hidden div with aria-live="polite"
  console.log('Screen Reader Announcement:', message, priority);
}

export function createFocusManager() {
  let savedElement: HTMLElement | null = null;
  return {
    saveFocus: () => {
      if (typeof document !== 'undefined') {
        savedElement = document.activeElement as HTMLElement;
      }
    },
    restoreFocus: () => {
      if (savedElement && typeof savedElement.focus === 'function') {
        savedElement.focus();
      }
    },
    clearFocus: () => {
      savedElement = null;
    }
  };
}

// Missing function for getFocusableElements
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )) as HTMLElement[];
}

// Missing responsive utils
export function getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'wide' | 'base' {
  if (typeof window === 'undefined') return 'base';
  const width = window.innerWidth;
  if (width >= 1280) return 'wide';
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  if (width >= 320) return 'mobile';
  return 'base';
}

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  const breakpoints: Record<Breakpoint, number> = { mobile: 320, tablet: 768, desktop: 1024, wide: 1280 };
  return window.innerWidth >= breakpoints[breakpoint];
}

export function getWindowWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth;
}

// Aliases for DesignSystemExample
export function getButtonClasses(variant?: string, size?: string, fullWidth?: boolean): string { return ''; }
export function getInputClasses(state?: string, size?: string): string { return ''; }
export function getCardClasses(variant?: string, size?: string): string { return ''; }
export function getAlertClasses(variant?: string): string { return ''; }
export function getBadgeClasses(variant?: string, size?: string): string { return ''; }
export function getColor(color: string): string { return color; }
export function getSpacing(space: string | number): string { return `${space}`; }
