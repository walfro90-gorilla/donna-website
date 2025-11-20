'use client';

import { useCallback, useState } from 'react';
import { EnhancedFileUpload, ImageCropper } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';

interface ImageUploadProps {
  bucket: 'restaurant-images' | 'profile-images' | 'vehicle-images';
  folderPath: string;
  onUploadComplete: (url: string) => void;
  label?: string;
  maxSize?: number; // Default 5MB
  className?: string;
  defaultImage?: string;
  aspect?: number; // Aspect ratio for cropping
}

export default function ImageUpload({
  bucket,
  folderPath,
  onUploadComplete,
  label = 'Subir Imagen',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
  defaultImage,
  aspect = 1
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // This function is called by EnhancedFileUpload when a file is selected
  // Instead of uploading immediately, we intercept it for cropping
  const handleFileSelect = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setSelectedFile(file);
        setIsCropping(true);
        // We resolve with a placeholder or empty string because the actual upload happens after cropping
        // However, EnhancedFileUpload expects a URL string on success.
        // Since we are interrupting the flow, we might need to adjust how EnhancedFileUpload works or 
        // simply return a dummy value and handle the actual upload separately.
        // For now, we'll return a dummy value to satisfy the promise, but the UI will show the cropper.
        resolve('pending_crop');
      });
      reader.addEventListener('error', (error) => reject(error));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    if (!selectedFile) return;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`.replace('//', '/');

      // Create a File object from the Blob
      const croppedFile = new File([croppedBlob], fileName, { type: selectedFile.type });

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, croppedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      setIsCropping(false);
      setImageSrc(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    }
  }, [bucket, folderPath, onUploadComplete, selectedFile]);

  const handleCancelCrop = useCallback(() => {
    setIsCropping(false);
    setImageSrc(null);
    setSelectedFile(null);
  }, []);

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      {defaultImage && (
        <div className="mb-4">
          <img
            src={defaultImage}
            alt="Preview"
            className="h-32 w-32 object-cover rounded-lg border border-gray-200"
          />
        </div>
      )}

      <EnhancedFileUpload
        onUpload={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        maxSize={maxSize}
        maxFiles={1}
        multiple={false}
        autoUpload={true} // We trigger handleFileSelect automatically
      />

      {isCropping && imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          aspect={aspect}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}
