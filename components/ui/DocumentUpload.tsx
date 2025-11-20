'use client';

import { useCallback } from 'react';
import { EnhancedFileUpload } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';

interface DocumentUploadProps {
    folderPath: string;
    onUploadComplete: (path: string) => void; // Returns the path, not public URL (since it's private)
    label?: string;
    maxSize?: number; // Default 10MB
    className?: string;
    acceptedFileTypes?: string;
}

export default function DocumentUpload({
    folderPath,
    onUploadComplete,
    label = 'Subir Documento',
    maxSize = 10 * 1024 * 1024, // 10MB
    className = '',
    acceptedFileTypes = 'application/pdf,image/jpeg,image/png,image/jpg'
}: DocumentUploadProps) {

    const handleUpload = useCallback(async (file: File): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folderPath}/${fileName}`.replace('//', '/');

            const { error: uploadError, data } = await supabase.storage
                .from('Documents')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // For private buckets, we usually store the path, not the public URL
            // The user can then create a signed URL when needed
            onUploadComplete(filePath);

            return filePath;
        } catch (error) {
            console.error('Error uploading document:', error);
            throw new Error('Error al subir el documento');
        }
    }, [folderPath, onUploadComplete]);

    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

            <EnhancedFileUpload
                onUpload={handleUpload}
                accept={acceptedFileTypes}
                maxSize={maxSize}
                maxFiles={1}
                multiple={false}
            />
        </div>
    );
}
