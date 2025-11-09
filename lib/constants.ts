// lib/constants.ts

// Enhanced Color Palette - Rappi-inspired design system
export const BRAND_COLORS = {
  // Primary colors
  primary: '#e4007c',
  primaryHover: '#c6006b',
  primaryLight: '#fef2f9',
  primaryLighter: '#fce4f3',
  primaryDark: '#a8005a',
  
  // Secondary colors
  secondary: '#00d4aa',
  secondaryHover: '#00b894',
  secondaryLight: '#f0fdf9',
  secondaryLighter: '#e6fffa',
  
  // Status colors
  success: '#10b981',
  successHover: '#059669',
  successLight: '#d1fae5',
  
  warning: '#f59e0b',
  warningHover: '#d97706',
  warningLight: '#fef3c7',
  
  error: '#ef4444',
  errorHover: '#dc2626',
  errorLight: '#fee2e2',
  
  info: '#3b82f6',
  infoHover: '#2563eb',
  infoLight: '#dbeafe',
  
  // Neutral colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// Rutas de la aplicación
export const ROUTES = {
  home: '/',
  clientes: '/clientes',
  socios: '/socios',
  repartidores: '/repartidores',
  pedir: '/pedir',
} as const;

// Mensajes de validación
export const VALIDATION_MESSAGES = {
  required: 'Este campo es obligatorio',
  emailInvalid: 'Por favor, ingresa un correo electrónico válido',
  phoneInvalid: 'Por favor, ingresa un número de teléfono válido',
  passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
  passwordWeak: 'La contraseña es muy débil',
  passwordMedium: 'La contraseña es moderada',
  passwordStrong: 'La contraseña es fuerte',
} as const;

// Estados de carga
export const LOADING_MESSAGES = {
  checking: 'Verificando...',
  sending: 'Enviando...',
  processing: 'Procesando...',
  loading: 'Cargando...',
} as const;

// Tiempos de debounce (en ms)
export const DEBOUNCE_DELAY = 500;

// Longitudes mínimas
export const MIN_LENGTHS = {
  password: 8,
  restaurantName: 3,
  name: 2,
  phone: 7,
} as const;

// Longitudes máximas
export const MAX_LENGTHS = {
  phone: 20,
  email: 255,
  name: 100,
  restaurantName: 100,
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// Spacing System (based on 4px grid)
export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

// Component Variants
export const COMPONENT_VARIANTS = {
  size: ['sm', 'md', 'lg', 'xl'] as const,
  variant: ['primary', 'secondary', 'outline', 'ghost'] as const,
  state: ['default', 'hover', 'active', 'disabled', 'loading'] as const,
} as const;

// Animation Durations
export const ANIMATIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// Z-Index Scale
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

// Border Radius Scale
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadow Scale
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

