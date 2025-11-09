// lib/supabase/storage.ts
import { createClient } from './client';

// Storage bucket names
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  RESTAURANT_IMAGES: 'restaurant-images',
  MENU_IMAGES: 'menu-images',
  PROFILE_IMAGES: 'profile-images',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  };
}

export interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    fullPath: string;
    publicUrl: string;
  };
  error?: string;
}

export interface DocumentMetadata {
  originalName: string;
  size: number;
  type: string;
  uploadedAt: Date;
  userId?: string;
  documentType?: string;
  validationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

// Initialize Supabase client
const supabase = createClient();

/**
 * Upload a file to Supabase storage with authentication
 */
export async function uploadFile({
  bucket,
  path,
  file,
  options = {}
}: UploadOptions): Promise<UploadResult> {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Validate file
    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'Archivo no válido'
      };
    }

    // Create full path with user ID for security
    const fullPath = `${user.id}/${path}`;

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: options.cacheControl || '3600',
        contentType: options.contentType || file.type,
        upsert: options.upsert || false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: `Error al subir archivo: ${error.message}`
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: publicUrlData.publicUrl
      }
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo'
    };
  }
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: `Error al eliminar archivo: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar archivo'
    };
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  bucket: StorageBucket, 
  path: string, 
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return {
        success: false,
        error: `Error al generar URL: ${error.message}`
      };
    }

    return {
      success: true,
      url: data.signedUrl
    };

  } catch (error) {
    console.error('Signed URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar URL'
    };
  }
}

/**
 * List files in a storage bucket path
 */
export async function listFiles(
  bucket: StorageBucket, 
  path?: string
): Promise<{ success: boolean; files?: StorageFile[]; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    const searchPath = path ? `${user.id}/${path}` : user.id;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(searchPath);

    if (error) {
      console.error('List files error:', error);
      return {
        success: false,
        error: `Error al listar archivos: ${error.message}`
      };
    }

    return {
      success: true,
      files: data
    };

  } catch (error) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al listar archivos'
    };
  }
}

/**
 * Get file metadata and info
 */
export async function getFileInfo(
  bucket: StorageBucket, 
  path: string
): Promise<{ success: boolean; file?: StorageFile; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: path
      });

    if (error) {
      console.error('Get file info error:', error);
      return {
        success: false,
        error: `Error al obtener información del archivo: ${error.message}`
      };
    }

    const file = data.find(f => f.name === path.split('/').pop());
    
    if (!file) {
      return {
        success: false,
        error: 'Archivo no encontrado'
      };
    }

    return {
      success: true,
      file
    };

  } catch (error) {
    console.error('Get file info error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener información del archivo'
    };
  }
}

/**
 * Upload document with validation and metadata
 */
export async function uploadDocument(
  file: File,
  documentType: string,
  metadata: Partial<DocumentMetadata> = {}
): Promise<UploadResult & { documentId?: string }> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${documentType}_${timestamp}.${fileExtension}`;
    const filePath = `documents/${fileName}`;

    // Upload file
    const uploadResult = await uploadFile({
      bucket: STORAGE_BUCKETS.DOCUMENTS,
      path: filePath,
      file,
      options: {
        contentType: file.type,
        upsert: false
      }
    });

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Store document metadata in database via RPC
    const documentMetadata: DocumentMetadata = {
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      documentType,
      validationStatus: 'pending',
      ...metadata
    };

    const { data: documentData, error: dbError } = await supabase
      .rpc('create_document_record', {
        file_path: uploadResult.data!.path,
        file_url: uploadResult.data!.publicUrl,
        metadata: documentMetadata
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await deleteFile(STORAGE_BUCKETS.DOCUMENTS, uploadResult.data!.path);
      
      return {
        success: false,
        error: `Error al guardar información del documento: ${dbError.message}`
      };
    }

    return {
      ...uploadResult,
      documentId: documentData?.id
    };

  } catch (error) {
    console.error('Upload document error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir documento'
    };
  }
}

/**
 * Clean up orphaned files (files without database records)
 */
export async function cleanupOrphanedFiles(bucket: StorageBucket): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Get all files for user
    const { success: listSuccess, files, error: listError } = await listFiles(bucket);
    
    if (!listSuccess || !files) {
      return {
        success: false,
        error: listError || 'Error al listar archivos'
      };
    }

    // Get database records for comparison
    const { data: dbRecords, error: dbError } = await supabase
      .rpc('get_user_document_paths', { user_id: user.id });

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        success: false,
        error: `Error al obtener registros de base de datos: ${dbError.message}`
      };
    }

    const dbPaths = new Set(dbRecords?.map((record: any) => record.file_path) || []);
    const orphanedFiles = files.filter(file => !dbPaths.has(`${user.id}/${file.name}`));

    // Delete orphaned files
    let deletedCount = 0;
    for (const file of orphanedFiles) {
      const { success: deleteSuccess } = await deleteFile(bucket, `${user.id}/${file.name}`);
      if (deleteSuccess) {
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount
    };

  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido durante la limpieza'
    };
  }
}

/**
 * Utility function to generate file path for different document types
 */
export function generateDocumentPath(documentType: string, userId: string, originalFileName: string): string {
  const timestamp = Date.now();
  const fileExtension = originalFileName.split('.').pop();
  const sanitizedType = documentType.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  return `${sanitizedType}/${userId}_${timestamp}.${fileExtension}`;
}

/**
 * Validate file before upload
 */
export function validateFileForUpload(file: File, maxSize: number = 10 * 1024 * 1024): {
  isValid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Archivo demasiado grande. Tamaño máximo: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de archivo no válido. Solo se permiten PDF, JPG, PNG y WebP'
    };
  }

  // Check file name
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Nombre de archivo demasiado largo'
    };
  }

  return { isValid: true };
}