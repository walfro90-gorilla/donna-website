// components/menu/ImageUploader.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Alert, Badge } from '@/components/ui';

export interface ImageRequirements {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  maxSize: number; // in bytes
  formats: string[];
  preferredAspectRatio?: string;
  quality?: number; // 0-1
  allowedFormats?: string[]; // Additional format conversion options
  autoOptimize?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ImageUploadProps {
  onUpload: (file: File, metadata?: ImageMetadata) => Promise<string>;
  onRemove?: () => void;
  requirements: ImageRequirements;
  preview?: string;
  aspectRatio?: number;
  cropEnabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  multiple?: boolean;
  showPreview?: boolean;
  showMetadata?: boolean;
}

export interface ImageMetadata {
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  fileSize: number;
  format: string;
  quality: number;
  cropArea?: CropArea;
  thumbnail?: string;
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
  description,
  showPreview = true,
  showMetadata = true
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [processingProgress, setProcessingProgress] = useState(0);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const allowedFormats = requirements.allowedFormats || requirements.formats;
    if (!allowedFormats.includes(file.type)) {
      const formatNames = allowedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ');
      return `Formato no válido. Formatos permitidos: ${formatNames}`;
    }

    // Check file size
    if (file.size > requirements.maxSize) {
      const maxSizeMB = (requirements.maxSize / (1024 * 1024)).toFixed(1);
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
    }

    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
      return 'El archivo seleccionado no es una imagen válida';
    }

    return null;
  }, [requirements]);

  const validateImageDimensions = useCallback((img: HTMLImageElement): string | null => {
    if (img.naturalWidth < requirements.minWidth || img.naturalHeight < requirements.minHeight) {
      return `La imagen debe tener al menos ${requirements.minWidth}x${requirements.minHeight} píxeles. Actual: ${img.naturalWidth}x${img.naturalHeight}`;
    }

    if (requirements.maxWidth && img.naturalWidth > requirements.maxWidth) {
      return `La imagen es demasiado ancha. Máximo: ${requirements.maxWidth}px, Actual: ${img.naturalWidth}px`;
    }

    if (requirements.maxHeight && img.naturalHeight > requirements.maxHeight) {
      return `La imagen es demasiado alta. Máximo: ${requirements.maxHeight}px, Actual: ${img.naturalHeight}px`;
    }

    return null;
  }, [requirements]);

  const processImage = useCallback(async (file: File, cropArea?: CropArea): Promise<{ file: File; metadata: ImageMetadata }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      img.onload = async () => {
        setProcessingProgress(20);
        
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = originalWidth;
        let sourceHeight = originalHeight;

        // Apply crop if provided
        if (cropArea) {
          const scaleX = originalWidth / 100;
          const scaleY = originalHeight / 100;
          
          sourceX = cropArea.x * scaleX;
          sourceY = cropArea.y * scaleY;
          sourceWidth = cropArea.width * scaleX;
          sourceHeight = cropArea.height * scaleY;
        }

        setProcessingProgress(40);

        // Calculate target dimensions maintaining aspect ratio
        let targetWidth = sourceWidth;
        let targetHeight = sourceHeight;

        if (aspectRatio && Math.abs(aspectRatio - (sourceWidth / sourceHeight)) > 0.01) {
          if (sourceWidth / sourceHeight > aspectRatio) {
            targetWidth = sourceHeight * aspectRatio;
          } else {
            targetHeight = sourceWidth / aspectRatio;
          }
        }

        // Auto-optimize dimensions if enabled
        if (requirements.autoOptimize) {
          const maxDimension = Math.min(requirements.maxWidth || 1200, requirements.maxHeight || 1200, 1200);
          if (targetWidth > maxDimension || targetHeight > maxDimension) {
            const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
            targetWidth *= scale;
            targetHeight *= scale;
          }
        }

        setProcessingProgress(60);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with high quality
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );

        setProcessingProgress(80);

        // Determine output format - convert to WebP if supported and not already WebP
        let outputFormat = file.type;
        let outputQuality = requirements.quality || 0.9;

        if (requirements.autoOptimize && file.type !== 'image/webp') {
          // Check if WebP is supported
          const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
          if (webpSupported) {
            outputFormat = 'image/webp';
            outputQuality = Math.min(outputQuality, 0.85); // WebP can use slightly lower quality
          }
        }

        // Generate thumbnail if required
        let thumbnailDataUrl: string | undefined;
        if (requirements.generateThumbnail) {
          const thumbnailSize = requirements.thumbnailSize || 150;
          const thumbnailCanvas = document.createElement('canvas');
          const thumbnailCtx = thumbnailCanvas.getContext('2d');
          
          if (thumbnailCtx) {
            const thumbnailScale = Math.min(thumbnailSize / targetWidth, thumbnailSize / targetHeight);
            thumbnailCanvas.width = targetWidth * thumbnailScale;
            thumbnailCanvas.height = targetHeight * thumbnailScale;
            
            thumbnailCtx.imageSmoothingEnabled = true;
            thumbnailCtx.imageSmoothingQuality = 'high';
            thumbnailCtx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
            
            thumbnailDataUrl = thumbnailCanvas.toDataURL('image/jpeg', 0.8);
          }
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setProcessingProgress(100);
              
              const processedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now()
              });

              const metadata: ImageMetadata = {
                originalSize: { width: originalWidth, height: originalHeight },
                processedSize: { width: targetWidth, height: targetHeight },
                fileSize: blob.size,
                format: outputFormat,
                quality: outputQuality,
                cropArea,
                thumbnail: thumbnailDataUrl
              };

              // Calculate optimization stats
              setOptimizationStats({
                originalSize: file.size,
                optimizedSize: blob.size,
                compressionRatio: ((file.size - blob.size) / file.size) * 100
              });

              resolve({ file: processedFile, metadata });
            } else {
              reject(new Error('Error al procesar la imagen'));
            }
          },
          outputFormat,
          outputQuality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }, [aspectRatio, requirements]);

  const handleUpload = useCallback(async (file: File, crop?: CropArea) => {
    setIsUploading(true);
    setError(null);
    setProcessingProgress(0);

    try {
      let fileToUpload = file;
      let metadata: ImageMetadata | undefined;
      
      // Process image if needed
      if (crop || requirements.quality || requirements.autoOptimize) {
        const result = await processImage(file, crop);
        fileToUpload = result.file;
        metadata = result.metadata;
        setImageMetadata(metadata);
      }

      await onUpload(fileToUpload, metadata);
      
      // Clean up
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setShowCropModal(false);
      setProcessingProgress(0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
      setProcessingProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, processImage, requirements, previewUrl]);

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
  }, [validateFile, validateImageDimensions, cropEnabled, aspectRatio, handleUpload]);

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
                <p className="text-sm text-gray-600">
                  {processingProgress > 0 ? `Procesando imagen... ${processingProgress}%` : 'Subiendo imagen...'}
                </p>
                {processingProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                )}
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
        {(preview || previewUrl) && showPreview && (
          <Card className="p-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={preview || previewUrl || ''}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg"
                  style={{ aspectRatio }}
                />
                {imageMetadata?.thumbnail && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Miniatura:</p>
                    <img
                      src={imageMetadata.thumbnail}
                      alt="Thumbnail"
                      className="w-12 h-12 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Imagen cargada
                    </p>
                    {selectedFile && (
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(selectedFile.size)} • {imageNaturalSize.width}x{imageNaturalSize.height}px
                        </p>
                        {requirements.autoOptimize && (
                          <Badge variant="success" size="sm">
                            Optimizada
                          </Badge>
                        )}
                      </div>
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

                {/* Image Metadata */}
                {showMetadata && imageMetadata && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Original:</span>
                        <p className="font-medium">
                          {imageMetadata.originalSize.width}x{imageMetadata.originalSize.height}px
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Procesada:</span>
                        <p className="font-medium">
                          {imageMetadata.processedSize.width}x{imageMetadata.processedSize.height}px
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Formato:</span>
                        <p className="font-medium uppercase">
                          {imageMetadata.format.split('/')[1]}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Calidad:</span>
                        <p className="font-medium">
                          {Math.round(imageMetadata.quality * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optimization Stats */}
                {optimizationStats && optimizationStats.compressionRatio > 0 && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div className="text-xs">
                        <p className="font-medium text-green-800">
                          Optimización: {optimizationStats.compressionRatio.toFixed(1)}% reducción
                        </p>
                        <p className="text-green-600">
                          {formatFileSize(optimizationStats.originalSize)} → {formatFileSize(optimizationStats.optimizedSize)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState(cropArea);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInitialCrop(cropArea);
  }, [cropArea]);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop(cropArea);
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    if (isDragging) {
      // Move crop area
      const newX = Math.max(0, Math.min(100 - cropArea.width, initialCrop.x + deltaX));
      const newY = Math.max(0, Math.min(100 - cropArea.height, initialCrop.y + deltaY));

      onCropChange({
        ...cropArea,
        x: newX,
        y: newY
      });
    } else if (isResizing) {
      // Resize crop area
      const newCrop = { ...initialCrop };

      switch (resizeHandle) {
        case 'nw':
          newCrop.x = Math.max(0, initialCrop.x + deltaX);
          newCrop.y = Math.max(0, initialCrop.y + deltaY);
          newCrop.width = Math.max(10, initialCrop.width - deltaX);
          newCrop.height = Math.max(10, initialCrop.height - deltaY);
          break;
        case 'ne':
          newCrop.y = Math.max(0, initialCrop.y + deltaY);
          newCrop.width = Math.max(10, Math.min(100 - newCrop.x, initialCrop.width + deltaX));
          newCrop.height = Math.max(10, initialCrop.height - deltaY);
          break;
        case 'sw':
          newCrop.x = Math.max(0, initialCrop.x + deltaX);
          newCrop.width = Math.max(10, initialCrop.width - deltaX);
          newCrop.height = Math.max(10, Math.min(100 - newCrop.y, initialCrop.height + deltaY));
          break;
        case 'se':
          newCrop.width = Math.max(10, Math.min(100 - newCrop.x, initialCrop.width + deltaX));
          newCrop.height = Math.max(10, Math.min(100 - newCrop.y, initialCrop.height + deltaY));
          break;
      }

      // Maintain aspect ratio if specified
      if (aspectRatio && aspectRatio > 0) {
        const currentRatio = newCrop.width / newCrop.height;
        if (Math.abs(currentRatio - aspectRatio) > 0.01) {
          if (currentRatio > aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          } else {
            newCrop.height = newCrop.width / aspectRatio;
          }
        }
      }

      // Ensure crop area stays within bounds
      newCrop.x = Math.max(0, Math.min(100 - newCrop.width, newCrop.x));
      newCrop.y = Math.max(0, Math.min(100 - newCrop.height, newCrop.y));
      newCrop.width = Math.min(100 - newCrop.x, newCrop.width);
      newCrop.height = Math.min(100 - newCrop.y, newCrop.height);

      onCropChange(newCrop);
    }
  }, [isDragging, isResizing, dragStart, cropArea, initialCrop, onCropChange, resizeHandle, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  const resetCrop = useCallback(() => {
    const resetArea = {
      x: 10,
      y: 10,
      width: 80,
      height: 80 / (aspectRatio || 1)
    };
    onCropChange(resetArea);
  }, [aspectRatio, onCropChange]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recortar Imagen
          </h3>
          <div className="flex items-center space-x-2">
            <Badge variant="info" size="sm">
              Ratio: {aspectRatio ? `${aspectRatio}:1` : 'Libre'}
            </Badge>
            <button
              onClick={resetCrop}
              disabled={isLoading}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Restablecer
            </button>
          </div>
        </div>
        
        <div
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 select-none"
          style={{ aspectRatio: '16/9', maxHeight: '500px' }}
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
          
          {/* Crop overlay with darkened outside area */}
          <div className="absolute inset-0 bg-black bg-opacity-40">
            <div
              className="absolute bg-transparent border-2 border-[#e4007c] shadow-lg"
              style={{
                left: `${cropArea.x}%`,
                top: `${cropArea.y}%`,
                width: `${cropArea.width}%`,
                height: `${cropArea.height}%`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
              onMouseDown={(e) => handleMouseDown(e)}
            >
              {/* Corner resize handles */}
              <div 
                className="absolute -top-2 -left-2 w-4 h-4 bg-[#e4007c] border-2 border-white rounded-full cursor-nw-resize hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              ></div>
              <div 
                className="absolute -top-2 -right-2 w-4 h-4 bg-[#e4007c] border-2 border-white rounded-full cursor-ne-resize hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              ></div>
              <div 
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#e4007c] border-2 border-white rounded-full cursor-sw-resize hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              ></div>
              <div 
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#e4007c] border-2 border-white rounded-full cursor-se-resize hover:scale-110 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              ></div>
              
              {/* Center move indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-[#e4007c] bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium">
                  Arrastra para mover
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crop info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">X:</span>
              <span className="ml-1 font-medium">{cropArea.x.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Y:</span>
              <span className="ml-1 font-medium">{cropArea.y.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Ancho:</span>
              <span className="ml-1 font-medium">{cropArea.width.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Alto:</span>
              <span className="ml-1 font-medium">{cropArea.height.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>💡 Arrastra las esquinas para redimensionar, el centro para mover</p>
          </div>
          
          <div className="flex space-x-3">
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
              className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isLoading ? 'Procesando...' : 'Confirmar Recorte'}</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}