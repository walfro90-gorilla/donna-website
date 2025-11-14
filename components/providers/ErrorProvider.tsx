// components/providers/ErrorProvider.tsx
"use client";

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import NetworkStatus from '@/components/ui/NetworkStatus';
import { handleError, UserFriendlyError } from '@/lib/utils/errorHandler';

interface ErrorContextType {
  reportError: (error: Error | string, context?: string) => UserFriendlyError;
  clearErrors: () => void;
  errors: UserFriendlyError[];
  isOnline: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

interface ErrorProviderProps {
  children: React.ReactNode;
  enableNetworkStatus?: boolean;
  enableGlobalErrorBoundary?: boolean;
}

export default function ErrorProvider({
  children,
  enableNetworkStatus = true,
  enableGlobalErrorBoundary = true
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<UserFriendlyError[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
        
      reportError(error, 'unhandled-promise');
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      reportError(event.error || new Error(event.message), 'global-error');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const reportError = useCallback((error: Error | string, context?: string): UserFriendlyError => {
    const userFriendlyError = handleError(error, context, true);
    
    setErrors(prev => {
      // Avoid duplicate errors
      const isDuplicate = prev.some(e => 
        e.message === userFriendlyError.message && 
        e.code === userFriendlyError.code
      );
      
      if (isDuplicate) return prev;
      
      // Keep only last 10 errors
      const newErrors = [userFriendlyError, ...prev].slice(0, 10);
      return newErrors;
    });
    
    return userFriendlyError;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const contextValue: ErrorContextType = {
    reportError,
    clearErrors,
    errors,
    isOnline
  };

  const content = (
    <ErrorContext.Provider value={contextValue}>
      {enableNetworkStatus && <NetworkStatus />}
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            maxWidth: '400px'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />
    </ErrorContext.Provider>
  );

  if (enableGlobalErrorBoundary) {
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Global error boundary caught:', error, errorInfo);
          reportError(error, 'error-boundary');
        }}
      >
        {content}
      </ErrorBoundary>
    );
  }

  return content;
}

// Hook for handling form errors specifically
export function useFormErrorHandler() {
  const { reportError } = useErrorContext();

  const handleFormError = useCallback((error: Error | string, fieldName?: string) => {
    const context = fieldName ? `form-field-${fieldName}` : 'form-submission';
    return reportError(error, context);
  }, [reportError]);

  const handleValidationError = useCallback((errors: Record<string, string>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
    
    return reportError(new Error(`Errores de validación: ${errorMessages}`), 'form-validation');
  }, [reportError]);

  return {
    handleFormError,
    handleValidationError
  };
}

// Hook for handling async operations with error handling
export function useAsyncOperation() {
  const { reportError } = useErrorContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<UserFriendlyError | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    options?: {
      showToast?: boolean;
      retries?: number;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const userFriendlyError = reportError(err as Error, context);
      setError(userFriendlyError);
      
      if (options?.showToast !== false) {
        // Error toast is already shown by reportError
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [reportError]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset
  };
}

// Component for displaying error summaries
export function ErrorSummary({ 
  maxErrors = 5,
  className = '',
  onDismiss
}: {
  maxErrors?: number;
  className?: string;
  onDismiss?: () => void;
}) {
  const { errors, clearErrors } = useErrorContext();
  
  if (errors.length === 0) return null;

  const displayErrors = errors.slice(0, maxErrors);
  const hasMoreErrors = errors.length > maxErrors;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            {errors.length === 1 ? 'Error reciente' : `${errors.length} errores recientes`}
          </h3>
          
          <ul className="space-y-1">
            {displayErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                • {error.message}
              </li>
            ))}
          </ul>
          
          {hasMoreErrors && (
            <p className="text-xs text-red-600 mt-2">
              Y {errors.length - maxErrors} errores más...
            </p>
          )}
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => {
              clearErrors();
              onDismiss?.();
            }}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Limpiar errores"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}