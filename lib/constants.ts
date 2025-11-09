// lib/constants.ts

// Colores de marca
export const BRAND_COLORS = {
  primary: '#e4007c',
  primaryHover: '#c6006b',
  primaryLight: '#fef2f9',
  primaryLighter: '#fce4f3',
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

