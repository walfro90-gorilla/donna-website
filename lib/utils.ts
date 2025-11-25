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
  }
};
