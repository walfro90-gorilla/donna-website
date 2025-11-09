// lib/utils/errorHandler.ts
import { getErrorMessage } from './errorMessages';

export interface ErrorResult {
  message: string;
  code?: string;
  field?: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown, context?: keyof typeof import('./errorMessages').ERROR_MESSAGES): ErrorResult {
  // Si es un AppError personalizado, devolverlo directamente
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      field: error.field,
    };
  }

  // Si es un Error de Supabase, extraer información relevante
  if (error && typeof error === 'object' && 'message' in error) {
    const message = getErrorMessage(error, context);
    const code = 'code' in error ? String(error.code) : undefined;
    const field = 'field' in error ? String(error.field) : undefined;

    return {
      message,
      code,
      field,
    };
  }

  // Error genérico
  return {
    message: getErrorMessage(error, context),
  };
}

export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error);
  }
  // En producción, podrías enviar el error a un servicio de logging
}

