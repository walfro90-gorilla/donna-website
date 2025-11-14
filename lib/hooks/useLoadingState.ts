// lib/hooks/useLoadingState.ts
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  error?: string;
  startTime?: number;
  estimatedDuration?: number;
}

export interface LoadingOptions {
  timeout?: number;
  showProgress?: boolean;
  estimatedDuration?: number;
  onTimeout?: () => void;
  onProgress?: (progress: number) => void;
}

// Hook for managing loading states
export function useLoadingState(initialState: Partial<LoadingState> = {}) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '',
    error: undefined,
    ...initialState
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const startLoading = useCallback((options: LoadingOptions & { message?: string } = {}) => {
    const startTime = Date.now();
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      progress: 0,
      message: options.message || prev.message,
      error: undefined,
      startTime,
      estimatedDuration: options.estimatedDuration
    }));

    // Set timeout if specified
    if (options.timeout) {
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          error: 'Tiempo de espera agotado'
        }));
        options.onTimeout?.();
      }, options.timeout);
    }

    // Auto-progress simulation if estimated duration is provided
    if (options.estimatedDuration && options.showProgress) {
      const progressStep = 100 / (options.estimatedDuration / 100); // Update every 100ms
      
      progressIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.isLoading) return prev;
          
          const elapsed = Date.now() - (prev.startTime || 0);
          const expectedProgress = Math.min((elapsed / (options.estimatedDuration || 1)) * 100, 95);
          
          if (expectedProgress > (prev.progress || 0)) {
            options.onProgress?.(expectedProgress);
            return { ...prev, progress: expectedProgress };
          }
          
          return prev;
        });
      }, 100);
    }
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || prev.message
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setState(prev => ({ ...prev, message }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
    
    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const stopLoading = useCallback((finalMessage?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      message: finalMessage || prev.message
    }));
    
    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      message: '',
      error: undefined
    });
    
    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    updateProgress,
    updateMessage,
    setError,
    stopLoading,
    reset
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || {
      isLoading: false,
      progress: 0,
      message: '',
      error: undefined
    };
  }, [states]);

  const startLoading = useCallback((key: string, options: LoadingOptions & { message?: string } = {}) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: true,
        progress: 0,
        message: options.message || '',
        error: undefined,
        startTime: Date.now(),
        estimatedDuration: options.estimatedDuration
      }
    }));
  }, []);

  const updateProgress = useCallback((key: string, progress: number, message?: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.max(0, Math.min(100, progress)),
        message: message || prev[key]?.message || ''
      }
    }));
  }, []);

  const stopLoading = useCallback((key: string, finalMessage?: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        progress: 100,
        message: finalMessage || prev[key]?.message || ''
      }
    }));
  }, []);

  const setError = useCallback((key: string, error: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        isLoading: false
      }
    }));
  }, []);

  const reset = useCallback((key?: string) => {
    if (key) {
      setStates(prev => {
        const newStates = { ...prev };
        delete newStates[key];
        return newStates;
      });
    } else {
      setStates({});
    }
  }, []);

  const isAnyLoading = Object.values(states).some(state => state.isLoading);
  const hasAnyError = Object.values(states).some(state => state.error);

  return {
    states,
    getState,
    startLoading,
    updateProgress,
    stopLoading,
    setError,
    reset,
    isAnyLoading,
    hasAnyError
  };
}

// Hook for async operations with loading state
export function useAsyncWithLoading<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: LoadingOptions = {}
) {
  const loadingState = useLoadingState();

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    try {
      loadingState.startLoading(options);
      const result = await asyncFn(...args);
      loadingState.stopLoading('Completado');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      loadingState.setError(errorMessage);
      return null;
    }
  }, [asyncFn, loadingState, options]);

  return {
    execute,
    ...loadingState
  };
}

// Hook for form submission with loading state
export function useFormSubmission<T>(
  submitFn: (data: T) => Promise<void>,
  options: LoadingOptions & {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  } = {}
) {
  const loadingState = useLoadingState();

  const submit = useCallback(async (data: T) => {
    try {
      loadingState.startLoading({
        ...options,
        message: 'Enviando formulario...'
      });
      
      await submitFn(data);
      
      loadingState.stopLoading('Formulario enviado exitosamente');
      options.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar formulario';
      loadingState.setError(errorMessage);
      options.onError?.(errorMessage);
    }
  }, [submitFn, loadingState, options]);

  return {
    submit,
    ...loadingState
  };
}

// Hook for file upload with progress
export function useFileUploadProgress() {
  const [uploads, setUploads] = useState<Record<string, LoadingState>>({});

  const startUpload = useCallback((fileId: string, fileName: string) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        isLoading: true,
        progress: 0,
        message: `Subiendo ${fileName}...`,
        error: undefined,
        startTime: Date.now()
      }
    }));
  }, []);

  const updateUploadProgress = useCallback((fileId: string, progress: number) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        progress: Math.max(0, Math.min(100, progress))
      }
    }));
  }, []);

  const completeUpload = useCallback((fileId: string) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        isLoading: false,
        progress: 100,
        message: 'Subida completada'
      }
    }));
  }, []);

  const failUpload = useCallback((fileId: string, error: string) => {
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        isLoading: false,
        error
      }
    }));
  }, []);

  const removeUpload = useCallback((fileId: string) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[fileId];
      return newUploads;
    });
  }, []);

  const getUploadState = useCallback((fileId: string) => {
    return uploads[fileId];
  }, [uploads]);

  const isAnyUploading = Object.values(uploads).some(upload => upload.isLoading);
  const totalProgress = Object.values(uploads).length > 0
    ? Object.values(uploads).reduce((sum, upload) => sum + (upload.progress || 0), 0) / Object.values(uploads).length
    : 0;

  return {
    uploads,
    startUpload,
    updateUploadProgress,
    completeUpload,
    failUpload,
    removeUpload,
    getUploadState,
    isAnyUploading,
    totalProgress
  };
}

export default useLoadingState;