// components/demo/DocumentManagementDemo.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  DocumentUploader, 
  DocumentPreview, 
  DocumentValidator,
  MEXICAN_BUSINESS_RULES,
  GENERAL_FILE_RULES
} from '@/components/documents';
import type { 
  DocumentRequirement, 
  UploadedDocument, 
  DocumentMetadata, 
  UploadResult 
} from '@/components/documents';
import { Card, CardHeader, CardTitle, CardContent, Alert, Badge } from '@/components/ui';
import { documentService, MEXICAN_BUSINESS_REQUIREMENTS, type Document } from '@/lib/supabase/document-service';

// Convert document service requirements to component-compatible format
const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = MEXICAN_BUSINESS_REQUIREMENTS.map(req => ({
  ...req,
  validationRules: req.validationRules?.map(rule => ({
    type: 'custom' as const,
    message: rule.message,
    validator: () => true // Placeholder validator for demo
  })) || []
}));

export default function DocumentManagementDemo() {
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument>>({});
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [validationFile, setValidationFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completenessStatus, setCompletenessStatus] = useState<{
    isComplete: boolean;
    missingDocuments: string[];
  } | null>(null);

  // Load existing documents on component mount
  useEffect(() => {
    loadDocuments();
    checkCompleteness();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentService.getUserDocuments();
      if (result.success && result.documents) {
        setDocuments(result.documents);
        
        // Convert to uploaded documents format for UI
        const uploadedDocs: Record<string, UploadedDocument> = {};
        result.documents.forEach(doc => {
          uploadedDocs[doc.document_type] = {
            id: doc.id,
            file: new File([], doc.original_name, { type: doc.file_type }),
            name: doc.original_name,
            size: doc.file_size,
            type: doc.file_type,
            url: doc.file_url,
            status: doc.validation_status === 'approved' ? 'uploaded' : 
                   doc.validation_status === 'rejected' ? 'error' : 'processing',
            error: doc.rejection_reason || undefined,
            metadata: doc.metadata
          };
        });
        setUploadedDocuments(uploadedDocs);
      } else {
        setError(result.error || 'Error al cargar documentos');
      }
    } catch (err) {
      setError('Error inesperado al cargar documentos');
      console.error('Load documents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkCompleteness = async () => {
    try {
      const result = await documentService.checkDocumentCompleteness('restaurant');
      if (result.success) {
        setCompletenessStatus({
          isComplete: result.isComplete || false,
          missingDocuments: result.missingDocuments || []
        });
      }
    } catch (err) {
      console.error('Check completeness error:', err);
    }
  };

  const handleUpload = async (file: File, metadata: DocumentMetadata): Promise<UploadResult> => {
    setError(null);
    
    try {
      // Create temporary document for UI feedback
      const tempDocumentId = `temp_${Date.now()}`;
      const tempDocument: UploadedDocument = {
        id: tempDocumentId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        metadata
      };

      setUploadedDocuments(prev => ({
        ...prev,
        [metadata.requirementId]: tempDocument
      }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedDocuments(prev => {
          const current = prev[metadata.requirementId];
          if (current && current.progress !== undefined && current.progress < 90) {
            return {
              ...prev,
              [metadata.requirementId]: {
                ...current,
                progress: current.progress + 10
              }
            };
          }
          return prev;
        });
      }, 200);

      // Upload document using service
      const result = await documentService.uploadDocument(
        file,
        metadata.requirementId,
        {
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        }
      );

      clearInterval(progressInterval);

      if (result.success && result.document) {
        // Update with real document data
        setUploadedDocuments(prev => ({
          ...prev,
          [metadata.requirementId]: {
            id: result.document!.id,
            file,
            name: result.document!.original_name,
            size: result.document!.file_size,
            type: result.document!.file_type,
            url: result.document!.file_url,
            status: 'uploaded',
            progress: 100,
            metadata: result.document!.metadata
          }
        }));

        // Refresh documents list and completeness
        await loadDocuments();
        await checkCompleteness();

        return {
          success: true,
          documentId: result.document.id,
          url: result.document.file_url
        };
      } else {
        throw new Error(result.error || 'Error al subir documento');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      // Update document status to error
      setUploadedDocuments(prev => ({
        ...prev,
        [metadata.requirementId]: {
          ...prev[metadata.requirementId],
          status: 'error',
          error: errorMessage,
          progress: 0
        }
      }));

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const handleRemove = async (documentId: string) => {
    try {
      const result = await documentService.deleteDocument(documentId);
      
      if (result.success) {
        // Remove from UI
        setUploadedDocuments(prev => {
          const newDocs = { ...prev };
          const requirementId = Object.keys(newDocs).find(key => newDocs[key].id === documentId);
          if (requirementId) {
            delete newDocs[requirementId];
          }
          return newDocs;
        });

        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
        }

        // Refresh documents and completeness
        await loadDocuments();
        await checkCompleteness();
      } else {
        setError(result.error || 'Error al eliminar documento');
      }
    } catch (err) {
      setError('Error inesperado al eliminar documento');
      console.error('Remove document error:', err);
    }
  };

  const handleApprove = async (documentId: string) => {
    try {
      const result = await documentService.updateDocumentValidation(documentId, 'approved');
      if (result.success) {
        await loadDocuments();
        await checkCompleteness();
      } else {
        setError(result.error || 'Error al aprobar documento');
      }
    } catch (err) {
      setError('Error inesperado al aprobar documento');
      console.error('Approve document error:', err);
    }
  };

  const handleReject = async (documentId: string, reason: string) => {
    try {
      const result = await documentService.updateDocumentValidation(documentId, 'rejected', reason);
      if (result.success) {
        await loadDocuments();
        await checkCompleteness();
      } else {
        setError(result.error || 'Error al rechazar documento');
      }
    } catch (err) {
      setError('Error inesperado al rechazar documento');
      console.error('Reject document error:', err);
    }
  };

  const getCompletionStatus = () => {
    const requiredDocs = DOCUMENT_REQUIREMENTS.filter(req => req.required);
    const approvedDocs = documents.filter(doc => 
      doc.validation_status === 'approved' && 
      requiredDocs.some(req => req.id === doc.document_type)
    );
    return {
      completed: approvedDocs.length,
      total: requiredDocs.length,
      percentage: requiredDocs.length > 0 ? Math.round((approvedDocs.length / requiredDocs.length) * 100) : 0
    };
  };

  const status = getCompletionStatus();

  const getStatusBadge = (validationStatus: string) => {
    switch (validationStatus) {
      case 'approved':
        return <Badge variant="success">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="error">Rechazado</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      default:
        return <Badge variant="default">Desconocido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Demo: Sistema de Gestión de Documentos con Supabase
          </h1>
          <p className="text-gray-600 mb-6">
            Sistema completo integrado con Supabase para subir, validar y gestionar documentos de registro de restaurantes
          </p>
          
          {/* Error Alert */}
          {error && (
            <Alert variant="error" className="max-w-2xl mx-auto mb-6">
              {error}
            </Alert>
          )}

          {/* Completeness Status */}
          {completenessStatus && (
            <Card className="max-w-2xl mx-auto mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Estado de Documentación
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {completenessStatus.isComplete 
                        ? 'Todos los documentos requeridos han sido subidos y aprobados'
                        : `Faltan ${completenessStatus.missingDocuments.length} documentos requeridos`
                      }
                    </p>
                  </div>
                  <Badge variant={completenessStatus.isComplete ? 'success' : 'warning'}>
                    {completenessStatus.isComplete ? 'Completo' : 'Incompleto'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Progress Summary */}
          <Card variant="elevated" className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#e4007c] mb-2">
                  {status.completed}/{status.total}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Documentos requeridos aprobados
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {status.percentage}% completado
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subir Documentos Requeridos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e4007c] mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Cargando documentos...</p>
                  </div>
                ) : (
                  DOCUMENT_REQUIREMENTS.map((requirement) => (
                    <DocumentUploader
                      key={requirement.id}
                      requirement={requirement}
                      onUpload={handleUpload}
                      onRemove={handleRemove}
                      existingDocument={uploadedDocuments[requirement.id]}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Preview and Validation Section */}
          <div className="space-y-6">
            {/* Document Validation Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Validador de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecciona un archivo para validar
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setValidationFile(file || null);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#e4007c] file:text-white hover:file:bg-[#c6006b]"
                    />
                  </div>
                  
                  {validationFile && (
                    <DocumentValidator
                      file={validationFile}
                      rules={[...GENERAL_FILE_RULES, ...MEXICAN_BUSINESS_RULES]}
                      showDetails={true}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Documentos Subidos</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">No hay documentos subidos</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((document) => (
                      <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {document.original_name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {document.document_type} • {Math.round(document.file_size / 1024)} KB
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(document.validation_status)}
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleApprove(document.id)}
                                disabled={document.validation_status === 'approved'}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleReject(document.id, 'Documento no válido')}
                                disabled={document.validation_status === 'rejected'}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              >
                                Rechazar
                              </button>
                            </div>
                          </div>
                        </div>
                        {document.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            Razón de rechazo: {document.rejection_reason}
                          </p>
                        )}
                        <div className="mt-2">
                          <a
                            href={document.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#e4007c] hover:text-[#c6006b] text-xs font-medium"
                          >
                            Ver documento →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Summary */}
            {status.completed === status.total && status.total > 0 && (
              <Alert variant="success">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>¡Todos los documentos requeridos han sido subidos exitosamente!</span>
                </div>
              </Alert>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Documentos Requeridos</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>RFC:</strong> Registro Federal de Contribuyentes actualizado</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>Certificado Bancario:</strong> Máximo 3 meses de antigüedad</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>Identificación:</strong> INE, cédula o pasaporte vigente</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Documentos Opcionales</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span><strong>Acta Constitutiva:</strong> Solo para personas morales</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span><strong>Poder Legal:</strong> Si aplica para representante</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}