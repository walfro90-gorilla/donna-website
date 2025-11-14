// components/ui/LoadingStates.tsx
"use client";

import { useState, useEffect } from 'react';
import Card from './Card';

export interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
}

export interface ProgressIndicatorProps {
  progress: number;
  total?: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  animated?: boolean;
  className?: string;
}

export interface SkeletonProps {
  lines?: number;
  height?: string;
  className?: string;
  avatar?: boolean;
  title?: boolean;
}

// Main loading spinner component
export function LoadingSpinner({ 
  isLoading, 
  message, 
  className = '', 
  size = 'md',
  variant = 'spinner'
}: LoadingStateProps) {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-[#e4007c] ${sizeClasses[size]}`} />
        {message && (
          <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`bg-[#e4007c] rounded-full animate-pulse ${
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
              }`}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.4s'
              }}
            />
          ))}
        </div>
        {message && (
          <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
        <div className={`bg-[#e4007c] rounded-full animate-pulse ${sizeClasses[size]}`} />
        {message && (
          <p className="mt-2 text-sm text-gray-600 text-center animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  return null;
}

// Progress indicator component
export function ProgressIndicator({
  progress,
  total = 100,
  showPercentage = true,
  showLabel = true,
  label,
  size = 'md',
  color = 'primary',
  animated = true,
  className = ''
}: ProgressIndicatorProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Animate progress changes
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  const percentage = Math.min(Math.max((displayProgress / total) * 100, 0), 100);
  
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-[#e4007c]',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && (
            <span className="text-sm font-medium text-gray-700">
              {label || 'Progreso'}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`${heightClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {progress !== total && animated && (
        <div className="mt-1 text-xs text-gray-500">
          {displayProgress} de {total}
        </div>
      )}
    </div>
  );
}

// File upload progress component
export function FileUploadProgress({
  fileName,
  progress,
  status = 'uploading',
  onCancel,
  onRetry,
  className = ''
}: {
  fileName: string;
  progress: number;
  status?: 'uploading' | 'success' | 'error' | 'cancelled';
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}) {
  const statusIcons = {
    uploading: (
      <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#e4007c]" />
    ),
    success: (
      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    cancelled: (
      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )
  };

  const statusColors = {
    uploading: 'text-blue-600',
    success: 'text-green-600',
    error: 'text-red-600',
    cancelled: 'text-gray-600'
  };

  const statusMessages = {
    uploading: 'Subiendo...',
    success: 'Completado',
    error: 'Error al subir',
    cancelled: 'Cancelado'
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {statusIcons[status]}
          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {fileName}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${statusColors[status]}`}>
            {statusMessages[status]}
          </span>
          
          {status === 'uploading' && onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Cancelar subida"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="text-[#e4007c] hover:text-[#c6006b] transition-colors"
              title="Reintentar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {status === 'uploading' && (
        <ProgressIndicator
          progress={progress}
          showLabel={false}
          showPercentage={true}
          size="sm"
          color="primary"
          animated={true}
        />
      )}
    </div>
  );
}

// Skeleton loading component
export function Skeleton({
  lines = 3,
  height = '1rem',
  className = '',
  avatar = false,
  title = false
}: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>
          </div>
        </div>
      )}
      
      {title && (
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="bg-gray-300 rounded"
            style={{ 
              height,
              width: index === lines - 1 ? '60%' : '100%'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Form skeleton for registration steps
export function FormSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <Skeleton title={true} lines={0} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-1/5"></div>
        <div className="h-24 bg-gray-300 rounded"></div>
      </div>
      
      <div className="flex justify-between">
        <div className="h-10 bg-gray-300 rounded w-24"></div>
        <div className="h-10 bg-gray-300 rounded w-24"></div>
      </div>
    </div>
  );
}

// Card skeleton for lists
export function CardSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Timeout handler component
export function TimeoutHandler({
  isLoading,
  timeout = 30000, // 30 seconds
  onTimeout,
  children
}: {
  isLoading: boolean;
  timeout?: number;
  onTimeout: () => void;
  children: React.ReactNode;
}) {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setHasTimedOut(true);
      onTimeout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-yellow-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Tiempo de espera agotado</h3>
        <p className="text-gray-600">La operación está tardando más de lo esperado.</p>
        <button
          onClick={() => {
            setHasTimedOut(false);
            onTimeout();
          }}
          className="px-4 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Export all components
export default {
  LoadingSpinner,
  ProgressIndicator,
  FileUploadProgress,
  Skeleton,
  FormSkeleton,
  CardSkeleton,
  TimeoutHandler
};