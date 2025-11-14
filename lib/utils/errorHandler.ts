// lib/utils/errorHandler.ts
"use client";

import { toast } from 'react-hot-toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actionable: boolean;
  actions?: ErrorAction[];
  severity: 'info' | 'warning' | 'error';
  code?: string;
  retryable?: boolean;
}

export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

// Error types and their user-friendly messages
const ERROR_MESSAGES: Record<string, UserFriendlyError> = {
  // Network errors
  NETWORK_ERROR: {
    title: 'Problema de conexión',
    message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
    actionable: true,
    severity: 'error',
    retryable: true,
    actions: [
      {
        label: 'Reintentar',
        action: () => window.location.reload(),
        primary: true
      }
    ]
  },
  
  TIMEOUT_ERROR: {
    title: 'Tiempo de espera agotado',
    message: 'La operación tardó demasiado tiempo. Inténtalo de nuevo.',
    actionable: true,
    severity: 'warning',
    retryable: true
  },
  
  // Authentication errors
  AUTH_ERROR: {
    title: 'Error de autenticación',
    message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    actionable: true,
    severity: 'error',
    actions: [
      {
        label: 'Iniciar sesión',
        action: () => window.location.href = '/login',
        primary: true
      }
    ]
  },
  
  PERMISSION_DENIED: {
    title: 'Acceso denegado',
    message: 'No tienes permisos para realizar esta acción.',
    actionable: false,
    severity: 'error'
  },
  
  // Validation errors
  VALIDATION_ERROR: {
    title: 'Datos inválidos',
    message: 'Por favor, revisa los datos ingresados y corrige los errores.',
    actionable: true,
    severity: 'warning'
  },
  
  // File upload errors
  FILE_TOO_LARGE: {
    title: 'Archivo demasiado grande',
    message: 'El archivo seleccionado excede el tamaño máximo permitido.',
    actionable: true,
    severity: 'warning'
  },
  
  FILE_TYPE_NOT_SUPPORTED: {
    title: 'Tipo de archivo no soportado',
    message: 'El formato del archivo no es compatible. Usa JPG, PNG o PDF.',
    actionable: true,
    severity: 'warning'
  },
  
  UPLOAD_FAILED: {
    title: 'Error al subir archivo',
    message: 'No se pudo subir el archivo. Verifica tu conexión e inténtalo de nuevo.',
    actionable: true,
    severity: 'error',
    retryable: true
  },
  
  // Database errors
  DATABASE_ERROR: {
    title: 'Error del servidor',
    message: 'Hubo un problema en nuestros servidores. Inténtalo más tarde.',
    actionable: true,
    severity: 'error',
    retryable: true
  },
  
  // Registration errors
  EMAIL_ALREADY_EXISTS: {
    title: 'Correo ya registrado',
    message: 'Este correo electrónico ya está registrado. ¿Quieres iniciar sesión?',
    actionable: true,
    severity: 'info',
    actions: [
      {
        label: 'Iniciar sesión',
        action: () => window.location.href = '/login',
        primary: true
      },
      {
        label: '¿Olvidaste tu contraseña?',
        action: () => window.location.href = '/forgot-password'
      }
    ]
  },
  
  REGISTRATION_FAILED: {
    title: 'Error en el registro',
    message: 'No se pudo completar el registro. Inténtalo de nuevo.',
    actionable: true,
    severity: 'error',
    retryable: true
  },
  
  // Generic errors
  UNKNOWN_ERROR: {
    title: 'Error inesperado',
    message: 'Ocurrió un error inesperado. Si el problema persiste, contacta soporte.',
    actionable: true,
    severity: 'error',
    actions: [
      {
        label: 'Contactar soporte',
        action: () => window.open('mailto:soporte@donarepartos.com', '_blank')
      }
    ]
  }
};

// Error classification
export function classifyError(error: Error | string): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();
  
  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  
  if (lowerMessage.includes('timeout')) {
    return 'TIMEOUT_ERROR';
  }
  
  // Authentication errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
    return 'AUTH_ERROR';
  }
  
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
    return 'PERMISSION_DENIED';
  }
  
  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }
  
  // File errors
  if (lowerMessage.includes('file too large') || lowerMessage.includes('size')) {
    return 'FILE_TOO_LARGE';
  }
  
  if (lowerMessage.includes('file type') || lowerMessage.includes('format')) {
    return 'FILE_TYPE_NOT_SUPPORTED';
  }
  
  if (lowerMessage.includes('upload')) {
    return 'UPLOAD_FAILED';
  }
  
  // Registration errors
  if (lowerMessage.includes('email') && lowerMessage.includes('exists')) {
    return 'EMAIL_ALREADY_EXISTS';
  }
  
  if (lowerMessage.includes('registration')) {
    return 'REGISTRATION_FAILED';
  }
  
  // Database errors
  if (lowerMessage.includes('database') || lowerMessage.includes('sql')) {
    return 'DATABASE_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}

// Main error handler
export function handleError(
  error: Error | string,
  context?: string | ErrorContext,
  showToast: boolean = true
): UserFriendlyError {
  const errorCode = classifyError(error);
  const userFriendlyError = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
  
  // Log error for debugging
  const errorContext: ErrorContext = typeof context === 'string' 
    ? { component: context }
    : context || {};
    
  logError(error, {
    ...errorContext,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  });
  
  // Show toast notification
  if (showToast) {
    showErrorToast(userFriendlyError);
  }
  
  return {
    ...userFriendlyError,
    code: errorCode
  };
}

// Error logging
function logError(error: Error | string, context: ErrorContext) {
  const errorData = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'object' ? error.stack : undefined,
    context,
    level: 'error'
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    try {
      // Example: Sentry.captureException(error, { contexts: { custom: context } });
    } catch (loggingError) {
      console.warn('Failed to log error to tracking service:', loggingError);
    }
  }
}

// Toast notifications for errors
function showErrorToast(error: UserFriendlyError) {
  const toastOptions = {
    duration: error.severity === 'error' ? 6000 : 4000,
    position: 'top-right' as const,
    style: {
      background: error.severity === 'error' ? '#fee2e2' : 
                  error.severity === 'warning' ? '#fef3c7' : '#dbeafe',
      color: error.severity === 'error' ? '#991b1b' : 
             error.severity === 'warning' ? '#92400e' : '#1e40af',
      border: `1px solid ${error.severity === 'error' ? '#fca5a5' : 
                           error.severity === 'warning' ? '#fcd34d' : '#93c5fd'}`
    }
  };
  
  toast.error(error.message, toastOptions);
}

// Retry mechanism with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error: Error) => {
      const errorCode = classifyError(error);
      return ERROR_MESSAGES[errorCode]?.retryable || false;
    }
  } = config;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === maxRetries || !retryCondition(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
}

// Error boundary hook
export function useErrorBoundary() {
  return {
    captureError: (error: Error, errorInfo?: any) => {
      handleError(error, {
        component: 'ErrorBoundary',
        additionalData: errorInfo
      });
    }
  };
}

// Network status monitoring
export function useNetworkStatus() {
  if (typeof window === 'undefined') {
    return { isOnline: true, isSlowConnection: false };
  }
  
  const isOnline = navigator.onLine;
  const connection = (navigator as any).connection;
  const isSlowConnection = connection ? 
    connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' : 
    false;
  
  return { isOnline, isSlowConnection };
}

// Fallback options for failed operations
export const fallbackOptions = {
  // Fallback for failed image uploads
  imageUploadFallback: () => ({
    title: 'Subida de imagen falló',
    message: 'Puedes continuar sin imagen y agregarla más tarde.',
    actions: [
      {
        label: 'Continuar sin imagen',
        action: () => {},
        primary: true
      },
      {
        label: 'Intentar de nuevo',
        action: () => {}
      }
    ]
  }),
  
  // Fallback for failed form submissions
  formSubmissionFallback: (formData: any) => ({
    title: 'Error al enviar formulario',
    message: 'Tus datos se han guardado localmente. Puedes intentar enviar de nuevo.',
    actions: [
      {
        label: 'Reintentar envío',
        action: () => {},
        primary: true
      },
      {
        label: 'Guardar como borrador',
        action: () => {
          localStorage.setItem('form_draft', JSON.stringify(formData));
        }
      }
    ]
  }),
  
  // Fallback for failed API calls
  apiCallFallback: () => ({
    title: 'Servicio no disponible',
    message: 'El servicio está temporalmente no disponible. Inténtalo más tarde.',
    actions: [
      {
        label: 'Reintentar',
        action: () => {},
        primary: true
      }
    ]
  })
};

// Export main functions
export default {
  handleError,
  retryWithBackoff,
  classifyError,
  useErrorBoundary,
  useNetworkStatus,
  fallbackOptions
};