// components/ui/ErrorBoundary.tsx
"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleError, useErrorBoundary } from '@/lib/utils/errorHandler';
import { Button, Alert } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  eventId?: string;
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  eventId 
}) => (
  <div className="min-h-[400px] flex items-center justify-center p-8">
    <div className="max-w-md w-full text-center space-y-6">
      <div className="text-red-500">
        <svg 
          className="w-16 h-16 mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-600 mb-4">
          Ocurrió un error inesperado. Nuestro equipo ha sido notificado.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="error" className="text-left mb-4">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium mb-2">
                Detalles del error (desarrollo)
              </summary>
              <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          </Alert>
        )}
        
        {eventId && (
          <p className="text-xs text-gray-500 mb-4">
            ID del error: {eventId}
          </p>
        )}
      </div>
      
      <div className="space-y-3">
        <Button 
          onClick={resetError}
          className="w-full"
          variant="primary"
        >
          Intentar de nuevo
        </Button>
        
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full"
        >
          Recargar página
        </Button>
        
        <Button 
          onClick={() => window.location.href = '/'}
          variant="ghost"
          className="w-full"
        >
          Ir al inicio
        </Button>
      </div>
    </div>
  </div>
);

// Registration-specific error fallback
export const RegistrationErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => (
  <div className="min-h-[400px] flex items-center justify-center p-8">
    <div className="max-w-lg w-full text-center space-y-6">
      <div className="text-orange-500">
        <svg 
          className="w-16 h-16 mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error en el registro
        </h2>
        <p className="text-gray-600 mb-4">
          Hubo un problema con el formulario de registro. Tus datos se han guardado 
          automáticamente y puedes continuar donde lo dejaste.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">
          ¿Qué puedes hacer?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 text-left">
          <li>• Intentar continuar con el registro</li>
          <li>• Recargar la página (tus datos están guardados)</li>
          <li>• Contactar soporte si el problema persiste</li>
        </ul>
      </div>
      
      <div className="space-y-3">
        <Button 
          onClick={resetError}
          className="w-full"
          variant="primary"
        >
          Continuar registro
        </Button>
        
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full"
        >
          Recargar página
        </Button>
        
        <Button 
          onClick={() => window.open('mailto:soporte@donarepartos.com', '_blank')}
          variant="ghost"
          className="w-full"
        >
          Contactar soporte
        </Button>
      </div>
    </div>
  </div>
);

// File upload error fallback
export const FileUploadErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => (
  <div className="text-center p-6 space-y-4">
    <div className="text-red-500">
      <svg 
        className="w-12 h-12 mx-auto mb-3" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
        />
      </svg>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Error al subir archivo
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        No se pudo subir el archivo. Verifica tu conexión e inténtalo de nuevo.
      </p>
    </div>
    
    <div className="space-y-2">
      <Button 
        onClick={resetError}
        size="sm"
        variant="primary"
      >
        Intentar de nuevo
      </Button>
      
      <Button 
        onClick={() => {/* Skip file upload */}}
        size="sm"
        variant="ghost"
      >
        Continuar sin archivo
      </Button>
    </div>
  </div>
);

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error and get event ID
    const errorResult = handleError(error, {
      component: 'ErrorBoundary',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    this.setState({
      errorInfo,
      eventId: errorResult.code || null
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );
      
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }

    // Reset error state when any prop changes (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetError();
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null
      });
    }, 100);
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    const { hasError, error, eventId } = this.state;
    const { children, fallback: Fallback = DefaultErrorFallback } = this.props;

    if (hasError && error) {
      return (
        <Fallback 
          error={error} 
          resetError={this.resetError}
          eventId={eventId || undefined}
        />
      );
    }

    return children;
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  const { captureError } = useErrorBoundary();
  
  return {
    captureError,
    handleAsyncError: (error: Error) => {
      // For async errors that don't trigger error boundaries
      captureError(error);
      handleError(error, 'async-operation');
    }
  };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorBoundary;