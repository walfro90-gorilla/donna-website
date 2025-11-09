// components/documents/DocumentUploader.tsx
"use client";

import { useState, useRef, useCallback } from 'react';
import { Badge, Alert } from '@/components/ui';

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number; // in bytes
  validationRules?: DocumentValidationRule[];
}

export interface DocumentValidationRule {
  type: 'fileSize' | 'fileType' | 'fileName' | 'custom';
  message: string;
  validator?: (file: File) => boolean;
}

export interface UploadedDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'uploading' | 'uploaded' | 'error' | 'processing';
  progress?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DocumentUploaderProps {
  requirement: DocumentRequirement;
  onUpload: (file: File, metadata: DocumentMetadata) => Promise<UploadResult>;
  onRemove: (documentId: string) => void;
  existingDocument?: UploadedDocument;
  disabled?: boolean;
  className?: string;
}

export interface DocumentMetadata {
  requirementId: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface UploadResult {
  success: boolean;
  documentId?: string;
  url?: string;
  error?: string;
}

export default function DocumentUploader({
  requirement,
  onUpload,
  onRemove,
  existingDocument,
  disabled = false,
  className = '',
}: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > requirement.maxSize) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${formatFileSize(requirement.maxSize)}`
      };
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = requirement.acceptedFormats.some(format => {
      if (format.startsWith('.')) {
        return format.toLowerCase() === `.${fileExtension}`;
      }
      return file.type.includes(format);
    });

    if (!isValidType) {
      return {
        isValid: false,
        error: `Formato no válido. Formatos aceptados: ${requirement.acceptedFormats.join(', ')}`
      };
    }

    // Custom validation rules
    if (requirement.validationRules) {
      for (const rule of requirement.validationRules) {
        if (rule.type === 'custom' && rule.validator && !rule.validator(file)) {
          return {
            isValid: false,
            error: rule.message
          };
        }
      }
    }

    return { isValid: true };
  }, [requirement]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Archivo no válido');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const metadata: DocumentMetadata = {
        requirementId: requirement.id,
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      };

      const result = await onUpload(file, metadata);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        throw new Error(result.error || 'Error al subir el archivo');
      }

      // Reset state after successful upload
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al subir el archivo');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [requirement, validateFile, onUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    if (existingDocument) {
      onRemove(existingDocument.id);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [existingDocument, onRemove]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'uploading':
      case 'processing':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Document Requirement Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">
              {requirement.name}
            </h3>
            {requirement.required ? (
              <Badge variant="error" size="sm">Requerido</Badge>
            ) : (
              <Badge variant="default" size="sm">Opcional</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {requirement.description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Formatos: {requirement.acceptedFormats.join(', ')} • 
            Tamaño máximo: {formatFileSize(requirement.maxSize)}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!existingDocument && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive 
              ? 'border-[#e4007c] bg-[#fef2f9]' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={requirement.acceptedFormats.join(',')}
            onChange={handleInputChange}
            disabled={disabled}
          />

          {isUploading ? (
            <div className="space-y-3">
              <svg className="w-8 h-8 text-blue-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p className="text-sm text-gray-600">Subiendo archivo...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-[#e4007c]">Haz clic para subir</span> o arrastra el archivo aquí
                </p>
                <p className="text-xs text-gray-500">
                  {requirement.acceptedFormats.join(', ')} hasta {formatFileSize(requirement.maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Document Display */}
      {existingDocument && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(existingDocument.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {existingDocument.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(existingDocument.size)} • {existingDocument.type}
                </p>
                {existingDocument.status === 'uploading' && existingDocument.progress && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div
                      className="bg-[#e4007c] h-1 rounded-full transition-all duration-300"
                      style={{ width: `${existingDocument.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {existingDocument.url && existingDocument.status === 'uploaded' && (
                <a
                  href={existingDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e4007c] hover:text-[#c6006b] text-sm font-medium"
                >
                  Ver
                </a>
              )}
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Eliminar documento"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {existingDocument.error && (
            <Alert variant="error" className="mt-3">
              {existingDocument.error}
            </Alert>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
    </div>
  );
}