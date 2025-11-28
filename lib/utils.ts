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
  }
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

export function generateResponsiveSpacingClasses(property: 'p' | 'm' | 'gap', sizes: { base?: string; mobile?: string; tablet?: string; desktop?: string }) {
  const classes = [];
  if (sizes.base) classes.push(`${property}-${sizes.base}`);
  if (sizes.mobile) classes.push(`sm:${property}-${sizes.mobile}`);
  if (sizes.tablet) classes.push(`md:${property}-${sizes.tablet}`);
  if (sizes.desktop) classes.push(`lg:${property}-${sizes.desktop}`);
  return classes.join(' ');
}

export function trapFocus(element: HTMLElement) {
  // Placeholder for focus trapping logic
  // In a real implementation, this would restrict tab navigation to the element
  console.log('Focus trapped in', element);
}

export function createFieldDescription(description: string, id: string) {
  // Helper to create aria-describedby props
  return {
    id,
    children: description
  };
}

export function announceToScreenReader(message: string) {
  // Simple implementation using a live region if it existed, or just logging for now
  // In a real app, you'd append a hidden div with aria-live="polite"
  console.log('Screen Reader Announcement:', message);
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
    }
  };
}
