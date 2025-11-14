// components/ui/NetworkStatus.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Alert, Button } from '@/components/ui';
import { useNetworkStatus } from '@/lib/utils/errorHandler';

export interface NetworkStatusProps {
  onRetry?: () => void;
  showOfflineMessage?: boolean;
  showSlowConnectionWarning?: boolean;
  className?: string;
}

export default function NetworkStatus({
  onRetry,
  showOfflineMessage = true,
  showSlowConnectionWarning = true,
  className = ''
}: NetworkStatusProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const { isOnline, isSlowConnection } = useNetworkStatus();

  useEffect(() => {
    // Show message when going offline
    if (!isOnline && showOfflineMessage) {
      setIsVisible(true);
      setWasOffline(true);
    }
    
    // Show reconnection message when coming back online
    if (isOnline && wasOffline) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    // Show slow connection warning
    if (isOnline && isSlowConnection && showSlowConnectionWarning) {
      setIsVisible(true);
    }
    
    // Hide when connection is good
    if (isOnline && !isSlowConnection && !wasOffline) {
      setIsVisible(false);
    }
  }, [isOnline, isSlowConnection, wasOffline, showOfflineMessage, showSlowConnectionWarning]);

  const handleRetry = useCallback(() => {
    onRetry?.();
    setIsVisible(false);
  }, [onRetry]);

  if (!isVisible) return null;

  // Offline message
  if (!isOnline) {
    return (
      <div className={`fixed top-4 left-4 right-4 z-50 ${className}`}>
        <Alert variant="error" className="shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
              </svg>
              <div>
                <h4 className="font-medium text-red-800">Sin conexión a internet</h4>
                <p className="text-sm text-red-700">
                  Verifica tu conexión. Los datos se guardarán localmente.
                </p>
              </div>
            </div>
            {onRetry && (
              <Button
                onClick={handleRetry}
                size="sm"
                variant="outline"
                className="ml-4"
              >
                Reintentar
              </Button>
            )}
          </div>
        </Alert>
      </div>
    );
  }

  // Back online message
  if (wasOffline) {
    return (
      <div className={`fixed top-4 left-4 right-4 z-50 ${className}`}>
        <Alert variant="success" className="shadow-lg">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-green-800">Conexión restaurada</h4>
              <p className="text-sm text-green-700">
                Ya puedes continuar con normalidad.
              </p>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Slow connection warning
  if (isSlowConnection) {
    return (
      <div className={`fixed top-4 left-4 right-4 z-50 ${className}`}>
        <Alert variant="warning" className="shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800">Conexión lenta</h4>
                <p className="text-sm text-yellow-700">
                  Tu conexión es lenta. Algunas funciones pueden tardar más.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="ml-4 text-yellow-800 hover:text-yellow-900"
            >
              ✕
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return null;
}

// Hook for network-aware operations
export function useNetworkAwareOperation() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [pendingOperations, setPendingOperations] = useState<Array<() => Promise<void>>>([]);

  const executeWhenOnline = useCallback((operation: () => Promise<void>) => {
    if (isOnline) {
      return operation();
    } else {
      setPendingOperations(prev => [...prev, operation]);
      return Promise.reject(new Error('Sin conexión a internet'));
    }
  }, [isOnline]);

  // Execute pending operations when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      const operations = [...pendingOperations];
      setPendingOperations([]);
      
      operations.forEach(async (operation) => {
        try {
          await operation();
        } catch (error) {
          console.error('Failed to execute pending operation:', error);
        }
      });
    }
  }, [isOnline, pendingOperations]);

  return {
    isOnline,
    isSlowConnection,
    executeWhenOnline,
    hasPendingOperations: pendingOperations.length > 0
  };
}

// Component for showing network-dependent content
export function NetworkAwareContent({
  children,
  offlineContent,
  slowConnectionContent,
  className = ''
}: {
  children: React.ReactNode;
  offlineContent?: React.ReactNode;
  slowConnectionContent?: React.ReactNode;
  className?: string;
}) {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (!isOnline && offlineContent) {
    return <div className={className}>{offlineContent}</div>;
  }

  if (isSlowConnection && slowConnectionContent) {
    return <div className={className}>{slowConnectionContent}</div>;
  }

  return <div className={className}>{children}</div>;
}

// Offline fallback component
export function OfflineFallback({
  title = "Sin conexión",
  message = "Parece que no tienes conexión a internet. Verifica tu conexión y vuelve a intentarlo.",
  onRetry,
  className = ''
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="text-gray-400 mb-6">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          {onRetry && (
            <Button onClick={onRetry} variant="primary" className="w-full">
              Reintentar
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="w-full"
          >
            Recargar página
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Mientras tanto...
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tus datos se guardan automáticamente</li>
            <li>• Puedes continuar cuando vuelvas a tener conexión</li>
            <li>• Verifica tu WiFi o datos móviles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}