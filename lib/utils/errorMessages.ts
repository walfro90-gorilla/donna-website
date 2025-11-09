// lib/utils/errorMessages.ts
import { VALIDATION_MESSAGES } from '@/lib/constants';

export const ERROR_MESSAGES = {
  // Errores de autenticación
  auth: {
    emailAlreadyRegistered: 'Este correo electrónico ya está registrado.',
    invalidCredentials: 'Credenciales inválidas. Por favor, verifica tu email y contraseña.',
    userNotFound: 'Usuario no encontrado.',
    weakPassword: 'La contraseña es muy débil. Debe tener al menos 8 caracteres.',
    signupFailed: 'No se pudo crear tu cuenta. Por favor, intenta de nuevo.',
    loginFailed: 'No se pudo iniciar sesión. Por favor, intenta de nuevo.',
  },

  // Errores de validación
  validation: {
    ...VALIDATION_MESSAGES,
    fieldsInvalid: 'Por favor, corrige los campos marcados antes de continuar.',
    addressRequired: 'Por favor, selecciona una dirección válida de la lista.',
    phoneAlreadyInUse: 'Este teléfono ya está en uso.',
    emailAlreadyInUse: 'Este correo electrónico ya está en uso.',
    restaurantNameAlreadyInUse: 'Este nombre de restaurante ya está en uso.',
  },

  // Errores de registro
  registration: {
    restaurantFailed: 'Se creó tu cuenta, pero hubo un problema al registrar el restaurante.',
    clientFailed: 'Se creó tu cuenta, pero hubo un problema al registrar tu perfil.',
    driverFailed: 'Se creó tu cuenta, pero hubo un problema al registrar tu perfil de repartidor.',
    generalFailed: 'Hubo un error al enviar tu solicitud. Por favor, intenta de nuevo.',
  },

  // Errores de red
  network: {
    connectionFailed: 'Error de conexión. Por favor, verifica tu internet e intenta de nuevo.',
    timeout: 'La solicitud tardó demasiado. Por favor, intenta de nuevo.',
    serverError: 'Error del servidor. Por favor, intenta más tarde.',
  },

  // Errores genéricos
  generic: {
    unexpected: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    tryAgain: 'Hubo un error. Por favor, intenta de nuevo.',
  },
} as const;

export function getErrorMessage(error: unknown, context?: keyof typeof ERROR_MESSAGES): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Verificar errores de Supabase
    if (message.includes('user already registered') || message.includes('email already registered')) {
      return ERROR_MESSAGES.auth.emailAlreadyRegistered;
    }

    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
      return ERROR_MESSAGES.auth.invalidCredentials;
    }

    if (message.includes('weak password') || message.includes('password')) {
      return ERROR_MESSAGES.auth.weakPassword;
    }

    // Verificar mensajes personalizados
    if (context && ERROR_MESSAGES[context]) {
      const contextMessages = ERROR_MESSAGES[context];
      if (typeof contextMessages === 'object') {
        for (const [key, value] of Object.entries(contextMessages)) {
          if (message.includes(key.toLowerCase()) || message === value) {
            return value;
          }
        }
      }
    }

    // Devolver el mensaje del error si es amigable
    if (error.message && !error.message.includes('error') && !error.message.includes('failed')) {
      return error.message;
    }
  }

  return ERROR_MESSAGES.generic.unexpected;
}

