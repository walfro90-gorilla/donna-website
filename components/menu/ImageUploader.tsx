// components/menu/ImageUploader.tsx
"use client";

import { useState, useRef, useCallback } from 'react';
import { Card, Alert } from '@/components/ui';

export interface ImageRequirements {
  minWidth: number;
  minHeight: number;
  maxSize: number; // in bytes
  formats: string[];
  preferredAspectRatio?: string;
  quality?: number; // 0-1
}

export interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => void;
  requirements: ImageRequirements;
  preview?: string;
  aspectRatio?: number;
  cropEnabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageUploader({
  onUpload,
  onRemove,
  requirements,
  preview,
  aspectRatio = 1,
  cropEnabled = false,
  className = '',
  label = 'Subir Imagen',
  description
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!requirements.formats.includes(file.type)) {
      return `Formato no válido. Formatos permitidos: ${requirements.formats.join(', ')}`;
    }

    // Check file size
    if (file.size > requirements.maxSize) {
      const maxSizeMB = (requirements.maxSize / (1024 * 1024)).toFixed(1);
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, [requirements]);

  const validateImageDimensions = useCallback((img: HTMLImageElement): string | null => {
    if (img.naturalWidth < requirements.minWidth || img.naturalHeight < requirements.minHeight) {
      return `La imagen debe tener al menos ${requirements.minWidth}x${requirements.minHeight} píxeles. Actual: ${img.naturalWidth}x${img.naturalHeight}`;
    }

    return null;
  }, [requirements]);

  const processImage = useCallback(async (file: File, cropArea?: CropArea): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      img.onload = () => {
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.naturalWidth;
        let sourceHeight = img.naturalHeight;

        // Apply crop if provided
        if (cropArea) {
          const scaleX = img.naturalWidth / 100;
          const scaleY = img.naturalHeight / 100;
          
          sourceX = cropArea.x * scaleX;
          sourceY = cropArea.y * scaleY;
          sourceWidth = cropArea.width * scaleX;
          sourceHeight = cropArea.height * scaleY;
        }

        // Calculate target dimensions maintaining aspect ratio
        let targetWidth = sourceWidth;
        let targetHeight = sourceHeight;

        if (aspectRatio && aspectRatio !== sourceWidth / sourceHeight) {
          if (sourceWidth / sourceHeight > aspectRatio) {
            targetWidth = sourceHeight * aspectRatio;
          } else {
            targetHeight = sourceWidth / aspectRatio;
          }
        }

        // Optimize size while maintaining quality
        const maxDimension = 1200;
        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
          targetWidth *= scale;
          targetHeight *= scale;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw and compress
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(processedFile);
            } else {
              reject(new Error('Error al procesar la imagen'));
            }
          },
          file.type,
          requirements.quality || 0.9
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }, [aspectRatio, requirements.quality]);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);

    // Validate dimensions
    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      
      const dimensionError = validateImageDimensions(img);
      if (dimensionError) {
        setError(dimensionError);
        return;
      }

      // Show crop modal if crop is enabled
      if (cropEnabled) {
        // Initialize crop area to center of image
        const cropWidth = Math.min(img.naturalWidth, img.naturalHeight * aspectRatio);
        const cropHeight = cropWidth / aspectRatio;
        const cropX = (100 - (cropWidth / img.naturalWidth * 100)) / 2;
        const cropY = (100 - (cropHeight / img.naturalHeight * 100)) / 2;
        
        setCropArea({
          x: cropX,
          y: cropY,
          width: cropWidth / img.naturalWidth * 100,
          height: cropHeight / img.naturalHeight * 100
        });
        
        setShowCropModal(true);
      } else {
        // Upload directly
        handleUpload(file);
      }
    };
    
    img.onerror = () => {
      setError('Error al cargar la imagen');
    };
    
    img.src = url;
  }, [validateFile, validateImageDimensions, cropEnabled, aspectRatio]);

  const handleUpload = useCallback(async (file: File, crop?: CropArea) => {
    setIsUploading(true);
    setError(null);

    try {
      let fileToUpload = file;
      
      // Process image if needed
      if (crop || requirements.quality) {
        fileToUpload = await processImage(file, crop);
      }

      await onUpload(fileToUpload);
      
      // Clean up
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setShowCropModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, processImage, requirements.quality, previewUrl]);

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  }, [previewUrl, onRemove]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Upload Area */}
        {!preview && !previewUrl && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive 
                ? 'border-[#e4007c] bg-[#fef2f9]' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={requirements.formats.join(',')}
              onChange={handleInputChange}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="space-y-3">
                <svg className="w-8 h-8 text-blue-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-600">Subiendo imagen...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-[#e4007c]">{label}</span> o arrastra la imagen aquí
                  </p>
                  {description && (
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {requirements.formats.map(format => format.split('/')[1].toUpperCase()).join(', ')} hasta {formatFileSize(requirements.maxSize)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Mínimo {requirements.minWidth}x{requirements.minHeight}px
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(preview || previewUrl) && (
          <Card className="p-4">
            <div className="flex items-start space-x-4">
              <img
                src={preview || previewUrl || ''}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                style={{ aspectRatio }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Imagen cargada
                    </p>
                    {selectedFile && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)} • {imageNaturalSize.width}x{imageNaturalSize.height}px
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {!preview && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-[#e4007c] hover:text-[#c6006b] text-sm font-medium disabled:opacity-50"
                      >
                        Cambiar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={isUploading}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Crop Modal */}
        {showCropModal && selectedFile && previewUrl && (
          <CropModal
            imageUrl={previewUrl}
            cropArea={cropArea}
            aspectRatio={aspectRatio}
            onCropChange={setCropArea}
            onConfirm={() => handleUpload(selectedFile, cropArea)}
            onCancel={() => {
              setShowCropModal(false);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              setPreviewUrl(null);
              setSelectedFile(null);
            }}
            isLoading={isUploading}
          />
        )}
      </div>
    </div>
  );
}

interface CropModalProps {
  imageUrl: string;
  cropArea: CropArea;
  aspectRatio: number;
  onCropChange: (crop: CropArea) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CropModal({
  imageUrl,
  cropArea,
  aspectRatio,
  onCropChange,
  onConfirm,
  onCancel,
  isLoading
}: CropModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    const newX = Math.max(0, Math.min(100 - cropArea.width, cropArea.x + deltaX));
    const newY = Math.max(0, Math.min(100 - cropArea.height, cropArea.y + deltaY));

    onCropChange({
      ...cropArea,
      x: newX,
      y: newY
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, cropArea, onCropChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recortar Imagen
        </h3>
        
        <div
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden mb-4"
          style={{ aspectRatio: '16/9', maxHeight: '400px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Crop preview"
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {/* Crop overlay */}
          <div
            className="absolute border-2 border-[#e4007c] bg-[#e4007c] bg-opacity-20 cursor-move"
            style={{
              left: `${cropArea.x}%`,
              top: `${cropArea.y}%`,
              width: `${cropArea.width}%`,
              height: `${cropArea.height}%`
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#e4007c] border border-white rounded-full cursor-nw-resize"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#e4007c] border border-white rounded-full cursor-ne-resize"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#e4007c] border border-white rounded-full cursor-sw-resize"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#e4007c] border border-white rounded-full cursor-se-resize"></div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </Card>
    </div>
  );
}