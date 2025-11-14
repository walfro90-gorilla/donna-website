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
  repartidores: '/registro-repartidor',
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

// Component Size Variants
export const COMPONENT_SIZES = {
  button: {
    sm: {
      height: '2rem',      // 32px
      padding: '0.5rem 0.75rem',
      fontSize: TYPOGRAPHY.fontSize.sm,
    },
    md: {
      height: '2.5rem',    // 40px
      padding: '0.625rem 1rem',
      fontSize: TYPOGRAPHY.fontSize.base,
    },
    lg: {
      height: '3rem',      // 48px
      padding: '0.75rem 1.5rem',
      fontSize: TYPOGRAPHY.fontSize.lg,
    },
    xl: {
      height: '3.5rem',    // 56px
      padding: '1rem 2rem',
      fontSize: TYPOGRAPHY.fontSize.xl,
    },
  },
  input: {
    sm: {
      height: '2rem',
      padding: '0.375rem 0.75rem',
      fontSize: TYPOGRAPHY.fontSize.sm,
    },
    md: {
      height: '2.5rem',
      padding: '0.5rem 0.75rem',
      fontSize: TYPOGRAPHY.fontSize.base,
    },
    lg: {
      height: '3rem',
      padding: '0.75rem 1rem',
      fontSize: TYPOGRAPHY.fontSize.lg,
    },
  },
  card: {
    sm: {
      padding: SPACING[4],
      borderRadius: BORDER_RADIUS.md,
    },
    md: {
      padding: SPACING[6],
      borderRadius: BORDER_RADIUS.lg,
    },
    lg: {
      padding: SPACING[8],
      borderRadius: BORDER_RADIUS.xl,
    },
  },
} as const;

// Responsive Utilities
export const RESPONSIVE_UTILITIES = {
  // Media queries
  mediaQueries: {
    mobile: `@media (min-width: ${BREAKPOINTS.mobile})`,
    tablet: `@media (min-width: ${BREAKPOINTS.tablet})`,
    desktop: `@media (min-width: ${BREAKPOINTS.desktop})`,
    wide: `@media (min-width: ${BREAKPOINTS.wide})`,
    // Additional media queries for better responsive control
    mobileOnly: `@media (max-width: ${parseInt(BREAKPOINTS.tablet) - 1}px)`,
    tabletOnly: `@media (min-width: ${BREAKPOINTS.tablet}) and (max-width: ${parseInt(BREAKPOINTS.desktop) - 1}px)`,
    desktopOnly: `@media (min-width: ${BREAKPOINTS.desktop}) and (max-width: ${parseInt(BREAKPOINTS.wide) - 1}px)`,
    // Orientation queries
    portrait: '@media (orientation: portrait)',
    landscape: '@media (orientation: landscape)',
    // High DPI queries
    retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  },
  
  // Container max widths
  containers: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Grid system
  grid: {
    columns: 12,
    gutter: SPACING[6],
    margins: {
      mobile: SPACING[4],
      tablet: SPACING[6],
      desktop: SPACING[8],
    },
  },
  
  // Touch-friendly sizing
  touchTargets: {
    minimum: '40px',
    recommended: '44px',
    comfortable: '48px',
    large: '56px',
  },
  
  // Mobile-first responsive patterns
  patterns: {
    // Stack on mobile, side-by-side on tablet+
    stackToSide: 'flex flex-col md:flex-row',
    // Single column on mobile, two on tablet, three on desktop
    responsiveGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    // Hide on mobile, show on tablet+
    hideOnMobile: 'hidden md:block',
    // Show on mobile, hide on tablet+
    showOnMobile: 'block md:hidden',
    // Full width on mobile, auto on desktop
    fullWidthMobile: 'w-full lg:w-auto',
    // Center on mobile, left align on desktop
    centerMobile: 'text-center lg:text-left',
  },
} as const;

// Component State Classes
export const STATE_CLASSES = {
  base: 'transition-all duration-200 ease-in-out',
  hover: 'hover:scale-105 hover:shadow-md',
  active: 'active:scale-95',
  focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  loading: 'cursor-wait opacity-75',
} as const;

// Form Validation States
export const VALIDATION_STATES = {
  default: {
    borderColor: BRAND_COLORS.gray[300],
    focusColor: BRAND_COLORS.primary,
  },
  valid: {
    borderColor: BRAND_COLORS.success,
    focusColor: BRAND_COLORS.success,
    iconColor: BRAND_COLORS.success,
  },
  invalid: {
    borderColor: BRAND_COLORS.error,
    focusColor: BRAND_COLORS.error,
    iconColor: BRAND_COLORS.error,
  },
  warning: {
    borderColor: BRAND_COLORS.warning,
    focusColor: BRAND_COLORS.warning,
    iconColor: BRAND_COLORS.warning,
  },
} as const;

// Layout Constants
export const LAYOUT = {
  header: {
    height: '4rem',
    zIndex: Z_INDEX.sticky,
  },
  sidebar: {
    width: '16rem',
    collapsedWidth: '4rem',
  },
  footer: {
    height: '3rem',
  },
  content: {
    maxWidth: RESPONSIVE_UTILITIES.containers['2xl'],
    padding: SPACING[6],
  },
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  maxSize: {
    image: 5 * 1024 * 1024,      // 5MB
    document: 10 * 1024 * 1024,  // 10MB
    video: 50 * 1024 * 1024,     // 50MB
  },
  acceptedTypes: {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
  },
  extensions: {
    image: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    document: ['.pdf', '.doc', '.docx'],
    video: ['.mp4', '.webm', '.ogg'],
  },
} as const;

// Registration Flow Constants
export const REGISTRATION_FLOW = {
  steps: {
    restaurant: 6,
    customer: 3,
    driver: 4,
  },
  persistence: {
    key: 'registration-data',
    expiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  validation: {
    debounceDelay: 300,
    retryAttempts: 3,
  },
} as const;

// Accessibility Constants
export const ACCESSIBILITY = {
  // WCAG 2.1 AA Compliance
  colorContrast: {
    normal: 4.5,      // Normal text contrast ratio
    large: 3,         // Large text contrast ratio
    nonText: 3,       // Non-text elements contrast ratio
  },
  
  // Focus management
  focusRing: {
    width: '2px',
    offset: '2px',
    color: BRAND_COLORS.primary,
    style: 'solid',
  },
  
  // Screen reader text
  srOnly: 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
  
  // Skip links
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:border focus:border-gray-300 focus:rounded',
  
  // ARIA labels and descriptions
  ariaLabels: {
    close: 'Cerrar',
    menu: 'Menú',
    search: 'Buscar',
    loading: 'Cargando',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    required: 'Campo obligatorio',
    optional: 'Campo opcional',
    expand: 'Expandir',
    collapse: 'Contraer',
    next: 'Siguiente',
    previous: 'Anterior',
    first: 'Primero',
    last: 'Último',
    page: 'Página',
    of: 'de',
    selected: 'Seleccionado',
    unselected: 'No seleccionado',
  },
  
  // Keyboard navigation
  keyboardShortcuts: {
    escape: 'Escape',
    enter: 'Enter',
    space: ' ',
    tab: 'Tab',
    arrowUp: 'ArrowUp',
    arrowDown: 'ArrowDown',
    arrowLeft: 'ArrowLeft',
    arrowRight: 'ArrowRight',
    home: 'Home',
    end: 'End',
    pageUp: 'PageUp',
    pageDown: 'PageDown',
  },
  
  // Semantic HTML roles
  roles: {
    button: 'button',
    link: 'link',
    heading: 'heading',
    banner: 'banner',
    navigation: 'navigation',
    main: 'main',
    complementary: 'complementary',
    contentinfo: 'contentinfo',
    search: 'search',
    form: 'form',
    dialog: 'dialog',
    alertdialog: 'alertdialog',
    alert: 'alert',
    status: 'status',
    progressbar: 'progressbar',
    tab: 'tab',
    tabpanel: 'tabpanel',
    tablist: 'tablist',
    menu: 'menu',
    menuitem: 'menuitem',
    menubar: 'menubar',
    listbox: 'listbox',
    option: 'option',
    combobox: 'combobox',
    tree: 'tree',
    treeitem: 'treeitem',
    grid: 'grid',
    gridcell: 'gridcell',
    row: 'row',
    columnheader: 'columnheader',
    rowheader: 'rowheader',
  },
  
  // Live regions
  liveRegions: {
    polite: 'polite',
    assertive: 'assertive',
    off: 'off',
  },
  
  // Focus trap utilities
  focusableSelectors: [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', '),
} as const;

