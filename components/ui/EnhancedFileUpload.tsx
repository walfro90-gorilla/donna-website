// components/ui/EnhancedFileUpload.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileUploadProgress, LoadingSpinner, ProgressIndicator } from '@/components/ui';
import { retryWithBackoff } from '@/lib/utils/errorHandler';

export interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';
  error?: string;
  url?: string;
  id: string;
}

export interface EnhancedFileUploadProps {
  onUpload: (file: File) => Promise<string>;
  onRemove?: (fileId: string) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  showProgress?: boolean;
  allowRetry?: boolean;
  autoUpload?: boolean;
}

export default function EnhancedFileUpload({
  onUpload,
  onRemove,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 1,
  multiple = false,
  disabled = false,
  className = '',
  children,
  showProgress = true,
  allowRetry = true,
  autoUpload = true
}: EnhancedFileUploadProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `El archivo es demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isAccepted) {
        return `Tipo de archivo no permitido. Formatos aceptados: ${accept}`;
      }
    }

    return null;
  }, [accept, maxSize]);

  const uploadFile = useCallback(async (fileState: FileUploadState) => {
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    let progressInterval: NodeJS.Timeout;

    try {
      setFiles(prev => prev.map(f =>
        f.id === fileState.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Simulate progress updates (in real implementation, this would come from the upload function)
      progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileState.id && f.status === 'uploading') {
            const newProgress = Math.min(f.progress + Math.random() * 20, 90);
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200);

      // Upload with retry mechanism
      const url = await retryWithBackoff(
        () => onUpload(fileState.file),
        {
          maxRetries: 3,
          baseDelay: 1000,
          retryCondition: (error) => !controller.signal.aborted
        }
      );

      clearInterval(progressInterval);

      if (!controller.signal.aborted) {
        setFiles(prev => prev.map(f =>
          f.id === fileState.id
            ? { ...f, status: 'success', progress: 100, url }
            : f
        ));
      }

      return url;
    } catch (error) {
      if (progressInterval!) clearInterval(progressInterval);

      if (controller.signal.aborted) {
        setFiles(prev => prev.map(f =>
          f.id === fileState.id
            ? { ...f, status: 'cancelled', progress: 0 }
            : f
        ));
      } else {
        setFiles(prev => prev.map(f =>
          f.id === fileState.id
            ? {
              ...f,
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : 'Error al subir archivo'
            }
            : f
        ));
      }

      throw error;
    } finally {
      uploadControllerRef.current = null;
    }
  }, [onUpload]);

  // Handle file selection
  const handleFiles = useCallback(async (selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    let shouldReplace = false;

    // Check file limit
    if (files.length + fileArray.length > maxFiles) {
      if (maxFiles === 1 && fileArray.length === 1) {
        shouldReplace = true;
      } else {
        alert(`Solo puedes subir máximo ${maxFiles} archivo${maxFiles > 1 ? 's' : ''}`);
        return;
      }
    }

    const newFiles: FileUploadState[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);

      if (validationError) {
        alert(validationError);
        continue;
      }

      const fileState: FileUploadState = {
        file,
        progress: 0,
        status: 'pending',
        id: generateFileId()
      };

      newFiles.push(fileState);
    }

    if (shouldReplace) {
      setFiles(newFiles);
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }

    // Auto upload if enabled
    if (autoUpload) {
      setIsUploading(true);

      try {
        await Promise.all(
          newFiles.map(fileState => uploadFile(fileState))
        );
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    }
  }, [files.length, maxFiles, validateFile, generateFileId, autoUpload, uploadFile]);

  // Handle file input change
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [handleFiles]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (!disabled) {
      const files = event.dataTransfer.files;
      if (files) {
        handleFiles(files);
      }
    }
  }, [disabled, handleFiles]);

  // Handle file removal
  const handleRemove = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    onRemove?.(fileId);
  }, [onRemove]);

  // Handle file retry
  const handleRetry = useCallback(async (fileId: string) => {
    const fileState = files.find(f => f.id === fileId);
    if (fileState) {
      try {
        await uploadFile(fileState);
      } catch (error) {
        console.error('Retry upload error:', error);
      }
    }
  }, [files, uploadFile]);

  // Handle upload cancellation
  const handleCancel = useCallback((fileId: string) => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
    }

    setFiles(prev => prev.map(f =>
      f.id === fileId
        ? { ...f, status: 'cancelled', progress: 0 }
        : f
    ));
  }, []);

  // Manual upload trigger
  const triggerUpload = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');

    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      await Promise.all(
        pendingFiles.map(fileState => uploadFile(fileState))
      );
    } catch (error) {
      console.error('Manual upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [files, uploadFile]);

  // Calculate overall progress
  const overallProgress = files.length > 0
    ? files.reduce((sum, file) => sum + file.progress, 0) / files.length
    : 0;

  const successfulUploads = files.filter(f => f.status === 'success').length;
  const failedUploads = files.filter(f => f.status === 'error').length;
  const uploadingFiles = files.filter(f => f.status === 'uploading').length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver
            ? 'border-[#e4007c] bg-pink-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {children || (
          <div className="space-y-2">
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-[#e4007c]">Haz clic para subir</span> o arrastra archivos aquí
              </p>
              {accept && (
                <p className="text-xs text-gray-500 mt-1">
                  Formatos: {accept}
                </p>
              )}
              {maxSize && (
                <p className="text-xs text-gray-500">
                  Tamaño máximo: {Math.round(maxSize / 1024 / 1024)}MB
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      {showProgress && files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {successfulUploads} de {files.length} archivos subidos
            </span>
            <span className="text-gray-500">
              {Math.round(overallProgress)}%
            </span>
          </div>

          <ProgressIndicator
            progress={overallProgress}
            showLabel={false}
            showPercentage={false}
            size="sm"
            color={failedUploads > 0 ? 'error' : 'primary'}
            animated={uploadingFiles > 0}
          />

          {uploadingFiles > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <LoadingSpinner size="sm" variant="dots" isLoading={true} />
              <span>Subiendo {uploadingFiles} archivo{uploadingFiles > 1 ? 's' : ''}...</span>
            </div>
          )}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileState) => (
            <FileUploadProgress
              key={fileState.id}
              fileName={fileState.file.name}
              progress={fileState.progress}
              status={fileState.status}
              onCancel={() => handleCancel(fileState.id)}
              onRetry={allowRetry ? () => handleRetry(fileState.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Manual Upload Button */}
      {!autoUpload && files.some(f => f.status === 'pending' || f.status === 'error') && (
        <div className="flex justify-center">
          <button
            onClick={triggerUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isUploading && <LoadingSpinner size="sm" variant="spinner" isLoading={true} />}
            <span>
              {isUploading ? 'Subiendo...' : 'Subir archivos'}
            </span>
          </button>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="text-xs text-gray-500 text-center space-x-4">
          {successfulUploads > 0 && (
            <span className="text-green-600">
              ✓ {successfulUploads} exitoso{successfulUploads > 1 ? 's' : ''}
            </span>
          )}
          {failedUploads > 0 && (
            <span className="text-red-600">
              ✗ {failedUploads} fallido{failedUploads > 1 ? 's' : ''}
            </span>
          )}
          {uploadingFiles > 0 && (
            <span className="text-blue-600">
              ⏳ {uploadingFiles} subiendo
            </span>
          )}
        </div>
      )}
    </div>
  );
}