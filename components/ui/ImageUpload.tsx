'use client';

import { useCallback } from 'react';
import { EnhancedFileUpload } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';

interface ImageUploadProps {
  bucket: 'restaurant-images' | 'profile-images' | 'vehicle-images';
  folderPath: string;
  onUploadComplete: (url: string) => void;
  label?: string;
  maxSize?: number; // Default 5MB
  className?: string;
  defaultImage?: string;
}

export default function ImageUpload({
  bucket,
  folderPath,
  onUploadComplete,
  label = 'Subir Imagen',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
  defaultImage
}: ImageUploadProps) {

  const handleUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`.replace('//', '/');

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
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
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Error al subir la imagen');
    }
  }, [bucket, folderPath, onUploadComplete]);

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
        onUpload={handleUpload}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        maxSize={maxSize}
        maxFiles={1}
        multiple={false}
      />
    </div>
  );
}
