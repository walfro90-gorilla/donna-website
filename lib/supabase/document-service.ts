// lib/supabase/document-service.ts
import { createClient } from './client';
import { 
  uploadDocument, 
  deleteFile, 
  STORAGE_BUCKETS, 
  validateFileForUpload,
  type DocumentMetadata 
} from './storage';

export interface Document {
  id: string;
  user_id: string;
  file_path: string;
  file_url: string;
  original_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  validation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DocumentValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'required' | 'format' | 'size' | 'content' | 'mexican_business';
  severity: 'error' | 'warning' | 'info';
  message: string;
  validator?: (file: File) => boolean;
}

export interface DocumentValidationResult {
  is_valid: boolean;
  validation_results: Array<{
    rule_id: string;
    rule_name: string;
    is_valid: boolean;
    message: string;
    severity: string;
  }>;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number;
  validationRules: DocumentValidationRule[];
}

// Mexican business document requirements
export const MEXICAN_BUSINESS_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: 'rfc',
    name: 'RFC (Registro Federal de Contribuyentes)',
    description: 'Documento oficial que acredita el registro ante el SAT',
    required: true,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 5 * 1024 * 1024, // 5MB
    validationRules: [
      {
        id: 'rfc-format',
        name: 'Formato RFC',
        description: 'Verifica que el RFC tenga el formato correcto',
        type: 'mexican_business',
        severity: 'error',
        message: 'El RFC debe tener el formato correcto'
      }
    ]
  },
  {
    id: 'certificado_bancario',
    name: 'Certificado Bancario',
    description: 'Certificado bancario oficial para verificar cuenta',
    required: true,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 5 * 1024 * 1024,
    validationRules: [
      {
        id: 'bank-certificate',
        name: 'Certificado Bancario',
        description: 'Valida que sea un certificado bancario oficial',
        type: 'mexican_business',
        severity: 'error',
        message: 'Debe ser un certificado bancario oficial'
      }
    ]
  },
  {
    id: 'identificacion',
    name: 'Identificación Oficial',
    description: 'INE, cédula profesional o pasaporte vigente',
    required: true,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 5 * 1024 * 1024,
    validationRules: [
      {
        id: 'identification-document',
        name: 'Documento de Identidad',
        description: 'Verifica que sea una identificación oficial válida',
        type: 'mexican_business',
        severity: 'error',
        message: 'Debe ser una identificación oficial válida'
      }
    ]
  },
  {
    id: 'acta_constitutiva',
    name: 'Acta Constitutiva',
    description: 'Solo requerida para personas morales',
    required: false,
    acceptedFormats: ['.pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB for legal documents
    validationRules: [
      {
        id: 'acta-constitutiva',
        name: 'Acta Constitutiva',
        description: 'Valida el acta constitutiva para personas morales',
        type: 'mexican_business',
        severity: 'warning',
        message: 'Solo requerida para personas morales'
      }
    ]
  },
  {
    id: 'poder_legal',
    name: 'Poder Legal',
    description: 'Solo si actúas en representación de terceros',
    required: false,
    acceptedFormats: ['.pdf'],
    maxSize: 10 * 1024 * 1024,
    validationRules: [
      {
        id: 'legal-power',
        name: 'Poder Legal',
        description: 'Valida el poder legal para representación',
        type: 'mexican_business',
        severity: 'warning',
        message: 'Solo requerido si actúas en representación de terceros'
      }
    ]
  }
];

class DocumentService {
  private supabase = createClient();

  /**
   * Upload a document with validation
   */
  async uploadDocument(
    file: File,
    documentType: string,
    metadata: Partial<DocumentMetadata> = {}
  ): Promise<{
    success: boolean;
    document?: Document;
    error?: string;
  }> {
    try {
      // Validate file before upload
      const validation = validateFileForUpload(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Upload document
      const uploadResult = await uploadDocument(file, documentType, metadata);
      
      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      // Get the created document record
      if (uploadResult.documentId) {
        const document = await this.getDocument(uploadResult.documentId);
        if (document.success && document.document) {
          return {
            success: true,
            document: document.document
          };
        }
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al subir documento'
      };
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<{
    success: boolean;
    document?: Document;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Get document error:', error);
        return {
          success: false,
          error: `Error al obtener documento: ${error.message}`
        };
      }

      return {
        success: true,
        document: data
      };

    } catch (error) {
      console.error('Get document error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al obtener documento'
      };
    }
  }

  /**
   * Get user documents with optional filtering
   */
  async getUserDocuments(
    documentType?: string,
    validationStatus?: string
  ): Promise<{
    success: boolean;
    documents?: Document[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_documents', {
          document_type_filter: documentType || null,
          validation_status_filter: validationStatus || null
        });

      if (error) {
        console.error('Get user documents error:', error);
        return {
          success: false,
          error: `Error al obtener documentos: ${error.message}`
        };
      }

      return {
        success: true,
        documents: data || []
      };

    } catch (error) {
      console.error('Get user documents error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al obtener documentos'
      };
    }
  }

  /**
   * Delete a document and its file
   */
  async deleteDocument(documentId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get document info first
      const documentResult = await this.getDocument(documentId);
      if (!documentResult.success || !documentResult.document) {
        return {
          success: false,
          error: 'Documento no encontrado'
        };
      }

      const document = documentResult.document;

      // Delete from database (this will also handle cleanup via RPC)
      const { error: dbError } = await this.supabase
        .rpc('delete_document_with_cleanup', {
          document_id: documentId
        });

      if (dbError) {
        console.error('Delete document DB error:', dbError);
        return {
          success: false,
          error: `Error al eliminar documento de la base de datos: ${dbError.message}`
        };
      }

      // Delete file from storage
      const { success: storageSuccess, error: storageError } = await deleteFile(
        STORAGE_BUCKETS.DOCUMENTS,
        document.file_path
      );

      if (!storageSuccess) {
        console.error('Delete document storage error:', storageError);
        // Document record is already deleted, but log the storage error
        console.warn(`Failed to delete storage file: ${storageError}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al eliminar documento'
      };
    }
  }

  /**
   * Update document validation status
   */
  async updateDocumentValidation(
    documentId: string,
    status: 'pending' | 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('update_document_validation', {
          document_id: documentId,
          new_status: status,
          rejection_reason: rejectionReason || null
        });

      if (error) {
        console.error('Update validation error:', error);
        return {
          success: false,
          error: `Error al actualizar validación: ${error.message}`
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Documento no encontrado o no autorizado'
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Update validation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al actualizar validación'
      };
    }
  }

  /**
   * Validate Mexican business document
   */
  async validateMexicanBusinessDocument(
    documentId: string,
    validationRules: DocumentValidationRule[]
  ): Promise<{
    success: boolean;
    validationResult?: DocumentValidationResult;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('validate_mexican_business_document', {
          document_id: documentId,
          validation_rules: validationRules
        });

      if (error) {
        console.error('Validation error:', error);
        return {
          success: false,
          error: `Error al validar documento: ${error.message}`
        };
      }

      return {
        success: true,
        validationResult: data?.[0] || { is_valid: false, validation_results: [] }
      };

    } catch (error) {
      console.error('Validation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al validar documento'
      };
    }
  }

  /**
   * Get document requirements for a specific user type
   */
  getDocumentRequirements(userType: 'restaurant' | 'driver' | 'customer'): DocumentRequirement[] {
    switch (userType) {
      case 'restaurant':
        return MEXICAN_BUSINESS_REQUIREMENTS;
      case 'driver':
        return [
          {
            id: 'driver_license',
            name: 'Licencia de Conducir',
            description: 'Licencia de conducir vigente',
            required: true,
            acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
            maxSize: 5 * 1024 * 1024,
            validationRules: [
              {
                id: 'driver-license',
                name: 'Licencia de Conducir',
                description: 'Verifica que la licencia esté vigente',
                type: 'mexican_business',
                severity: 'error',
                message: 'La licencia debe estar vigente'
              }
            ]
          },
          {
            id: 'vehicle_registration',
            name: 'Registro Vehicular',
            description: 'Tarjeta de circulación del vehículo',
            required: true,
            acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
            maxSize: 5 * 1024 * 1024,
            validationRules: [
              {
                id: 'vehicle-registration',
                name: 'Registro Vehicular',
                description: 'Verifica el registro del vehículo',
                type: 'mexican_business',
                severity: 'error',
                message: 'El registro vehicular debe estar vigente'
              }
            ]
          },
          ...MEXICAN_BUSINESS_REQUIREMENTS.filter(req => req.id === 'identificacion')
        ];
      case 'customer':
        return []; // Customers typically don't need document verification
      default:
        return [];
    }
  }

  /**
   * Check if user has completed all required documents
   */
  async checkDocumentCompleteness(userType: 'restaurant' | 'driver' | 'customer'): Promise<{
    success: boolean;
    isComplete?: boolean;
    missingDocuments?: string[];
    error?: string;
  }> {
    try {
      const requirements = this.getDocumentRequirements(userType);
      const requiredDocuments = requirements.filter(req => req.required);

      const { success, documents, error } = await this.getUserDocuments();
      
      if (!success || !documents) {
        return {
          success: false,
          error: error || 'Error al obtener documentos'
        };
      }

      const uploadedTypes = new Set(documents.map(doc => doc.document_type));
      const missingDocuments = requiredDocuments
        .filter(req => !uploadedTypes.has(req.id))
        .map(req => req.name);

      return {
        success: true,
        isComplete: missingDocuments.length === 0,
        missingDocuments
      };

    } catch (error) {
      console.error('Check completeness error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al verificar completitud'
      };
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;