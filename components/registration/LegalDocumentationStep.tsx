// components/registration/LegalDocumentationStep.tsx
"use client";

import { useState, useCallback } from 'react';
import { Card, Alert, Badge } from '@/components/ui';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentValidator from '@/components/documents/DocumentValidator';

export interface LegalDocument {
  id: string;
  type: DocumentType;
  file?: File;
  url?: string;
  status: 'pending' | 'uploaded' | 'validated' | 'rejected';
  validationResult?: any;
  rejectionReason?: string;
  isRequired: boolean;
}

export type DocumentType = 
  | 'business_license'
  | 'tax_id'
  | 'health_permit'
  | 'fire_permit'
  | 'alcohol_license'
  | 'identity_document'
  | 'proof_of_address'
  | 'bank_statement'
  | 'insurance_policy'
  | 'other';

export interface LegalDocumentation {
  documents: LegalDocument[];
  businessLegalName: string;
  taxId: string;
  businessRegistrationNumber?: string;
  healthPermitNumber?: string;
  firePermitNumber?: string;
  alcoholLicenseNumber?: string;
  insurancePolicyNumber?: string;
  legalRepresentative: {
    name: string;
    position: string;
    idNumber: string;
    phone: string;
    email: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface LegalDocumentationStepProps {
  data: Partial<LegalDocumentation>;
  onDataChange: (data: Partial<LegalDocumentation>) => void;
  onNext: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
  onDocumentUpload?: (file: File, type: DocumentType) => Promise<string>;
}

const DOCUMENT_TYPES: Array<{
  id: DocumentType;
  name: string;
  description: string;
  isRequired: boolean;
  acceptedFormats: string[];
  maxSize: number;
}> = [
  {
    id: 'business_license',
    name: 'Licencia de Funcionamiento',
    description: 'Licencia municipal para operar el negocio',
    isRequired: true,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  {
    id: 'tax_id',
    name: 'RFC (Registro Federal de Contribuyentes)',
    description: 'Cédula de identificación fiscal',
    isRequired: true,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  {
    id: 'health_permit',
    name: 'Permiso Sanitario',
    description: 'Permiso de la Secretaría de Salud',
    isRequired: true,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  {
    id: 'fire_permit',
    name: 'Permiso de Bomberos',
    description: 'Certificado de seguridad contra incendios',
    isRequired: true,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  {
    id: 'identity_document',
    name: 'Identificación Oficial',
    description: 'INE, pasaporte o cédula profesional del representante legal',
    isRequired: true,
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  {
    id: 'proof_of_address',
    name: 'Comprobante de Domicilio',
    description: 'Recibo de luz, agua o predial (no mayor a 3 meses)',
    isRequired: true,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  {
    id: 'alcohol_license',
    name: 'Licencia de Bebidas Alcohólicas',
    description: 'Solo si vendes bebidas alcohólicas',
    isRequired: false,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  {
    id: 'bank_statement',
    name: 'Estado de Cuenta Bancario',
    description: 'Estado de cuenta del negocio (último mes)',
    isRequired: false,
    acceptedFormats: ['application/pdf'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  {
    id: 'insurance_policy',
    name: 'Póliza de Seguro',
    description: 'Seguro de responsabilidad civil',
    isRequired: false,
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024 // 10MB
  }
];

export default function LegalDocumentationStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading = false,
  errors = {},
  onDocumentUpload
}: LegalDocumentationStepProps) {
  const [localData, setLocalData] = useState<Partial<LegalDocumentation>>(data);
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<DocumentType>>(new Set());

  const handleInputChange = useCallback((field: keyof LegalDocumentation, value: any) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  }, [localData, onDataChange]);

  const handleLegalRepresentativeChange = useCallback((field: string, value: string) => {
    const updatedRepresentative = {
      ...localData.legalRepresentative,
      [field]: value
    };
    handleInputChange('legalRepresentative', updatedRepresentative);
  }, [localData.legalRepresentative, handleInputChange]);

  const handleEmergencyContactChange = useCallback((field: string, value: string) => {
    const updatedContact = {
      ...localData.emergencyContact,
      [field]: value
    };
    handleInputChange('emergencyContact', updatedContact);
  }, [localData.emergencyContact, handleInputChange]);

  const handleDocumentUploadSuccess = useCallback(async (file: File, type: DocumentType) => {
    setUploadingDocuments(prev => new Set(prev).add(type));
    
    try {
      let documentUrl = '';
      if (onDocumentUpload) {
        documentUrl = await onDocumentUpload(file, type);
      }

      const newDocument: LegalDocument = {
        id: `${type}_${Date.now()}`,
        type,
        file,
        url: documentUrl,
        status: 'uploaded',
        isRequired: DOCUMENT_TYPES.find(dt => dt.id === type)?.isRequired || false
      };

      const existingDocuments = localData.documents || [];
      const updatedDocuments = existingDocuments.filter(doc => doc.type !== type);
      updatedDocuments.push(newDocument);

      handleInputChange('documents', updatedDocuments);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(type);
        return newSet;
      });
    }
  }, [localData.documents, onDocumentUpload, handleInputChange]);

  const handleDocumentRemove = useCallback((type: DocumentType) => {
    const existingDocuments = localData.documents || [];
    const updatedDocuments = existingDocuments.filter(doc => doc.type !== type);
    handleInputChange('documents', updatedDocuments);
  }, [localData.documents, handleInputChange]);

  const getDocumentByType = useCallback((type: DocumentType): LegalDocument | undefined => {
    return localData.documents?.find(doc => doc.type === type);
  }, [localData.documents]);

  const validateForm = useCallback((): boolean => {
    const requiredFields = ['businessLegalName', 'taxId'];
    const basicInfoValid = requiredFields.every(field => localData[field as keyof LegalDocumentation]);
    
    const legalRepValid = !!(localData.legalRepresentative && 
      localData.legalRepresentative.name &&
      localData.legalRepresentative.position &&
      localData.legalRepresentative.idNumber &&
      localData.legalRepresentative.phone &&
      localData.legalRepresentative.email);

    const requiredDocuments = DOCUMENT_TYPES.filter(dt => dt.isRequired);
    const documentsValid = requiredDocuments.every(docType => 
      getDocumentByType(docType.id)?.status === 'uploaded'
    );

    return basicInfoValid && legalRepValid && documentsValid;
  }, [localData, getDocumentByType]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      onNext();
    }
  }, [validateForm, onNext]);

  const getRequiredDocumentsCount = useCallback(() => {
    const required = DOCUMENT_TYPES.filter(dt => dt.isRequired).length;
    const uploaded = DOCUMENT_TYPES.filter(dt => dt.isRequired && getDocumentByType(dt.id)?.status === 'uploaded').length;
    return { required, uploaded };
  }, [getDocumentByType]);

  const { required: requiredCount, uploaded: uploadedCount } = getRequiredDocumentsCount();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Documentación Legal
        </h2>
        <p className="text-gray-600">
          Sube los documentos requeridos para operar legalmente en México
        </p>
        <div className="mt-4">
          <Badge variant={uploadedCount === requiredCount ? 'success' : 'warning'}>
            {uploadedCount}/{requiredCount} documentos requeridos
          </Badge>
        </div>
      </div>

      {/* Business Legal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Legal del Negocio
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="businessLegalName" className="block text-sm font-medium text-gray-700 mb-2">
              Razón Social *
            </label>
            <input
              type="text"
              id="businessLegalName"
              value={localData.businessLegalName || ''}
              onChange={(e) => handleInputChange('businessLegalName', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.businessLegalName ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Nombre legal registrado del negocio"
            />
            {errors.businessLegalName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessLegalName}</p>
            )}
          </div>

          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
              RFC *
            </label>
            <input
              type="text"
              id="taxId"
              value={localData.taxId || ''}
              onChange={(e) => handleInputChange('taxId', e.target.value.toUpperCase())}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.taxId ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="XAXX010101000"
              maxLength={13}
            />
            {errors.taxId && (
              <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>
            )}
          </div>

          <div>
            <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Registro Empresarial
            </label>
            <input
              type="text"
              id="businessRegistrationNumber"
              value={localData.businessRegistrationNumber || ''}
              onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Número de registro en el SAT"
            />
          </div>

          <div>
            <label htmlFor="healthPermitNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Permiso Sanitario
            </label>
            <input
              type="text"
              id="healthPermitNumber"
              value={localData.healthPermitNumber || ''}
              onChange={(e) => handleInputChange('healthPermitNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Número del permiso de salud"
            />
          </div>
        </div>
      </Card>

      {/* Legal Representative */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Representante Legal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="repName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              id="repName"
              value={localData.legalRepresentative?.name || ''}
              onChange={(e) => handleLegalRepresentativeChange('name', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors['legalRepresentative.name'] ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Nombre del representante legal"
            />
            {errors['legalRepresentative.name'] && (
              <p className="mt-1 text-sm text-red-600">{errors['legalRepresentative.name']}</p>
            )}
          </div>

          <div>
            <label htmlFor="repPosition" className="block text-sm font-medium text-gray-700 mb-2">
              Cargo *
            </label>
            <input
              type="text"
              id="repPosition"
              value={localData.legalRepresentative?.position || ''}
              onChange={(e) => handleLegalRepresentativeChange('position', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Ej: Propietario, Gerente General"
            />
          </div>

          <div>
            <label htmlFor="repIdNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Identificación *
            </label>
            <input
              type="text"
              id="repIdNumber"
              value={localData.legalRepresentative?.idNumber || ''}
              onChange={(e) => handleLegalRepresentativeChange('idNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Número de INE, pasaporte o cédula"
            />
          </div>

          <div>
            <label htmlFor="repPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              id="repPhone"
              value={localData.legalRepresentative?.phone || ''}
              onChange={(e) => handleLegalRepresentativeChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="+52 55 1234 5678"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="repEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="repEmail"
              value={localData.legalRepresentative?.email || ''}
              onChange={(e) => handleLegalRepresentativeChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="representante@empresa.com"
            />
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contacto de Emergencia
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              id="emergencyName"
              value={localData.emergencyContact?.name || ''}
              onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Nombre del contacto"
            />
          </div>

          <div>
            <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-gray-700 mb-2">
              Parentesco/Relación
            </label>
            <input
              type="text"
              id="emergencyRelationship"
              value={localData.emergencyContact?.relationship || ''}
              onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Ej: Cónyuge, Socio, Familiar"
            />
          </div>

          <div>
            <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              id="emergencyPhone"
              value={localData.emergencyContact?.phone || ''}
              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="+52 55 1234 5678"
            />
          </div>
        </div>
      </Card>

      {/* Document Upload */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Documentos Requeridos
        </h3>
        
        <div className="space-y-6">
          {DOCUMENT_TYPES.map((docType) => {
            const existingDoc = getDocumentByType(docType.id);
            const isUploading = uploadingDocuments.has(docType.id);
            
            return (
              <div key={docType.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{docType.name}</h4>
                      {docType.isRequired && (
                        <Badge variant="warning" size="sm">Requerido</Badge>
                      )}
                      {existingDoc?.status === 'uploaded' && (
                        <Badge variant="success" size="sm">Subido</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: {docType.acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} • 
                      Máximo: {(docType.maxSize / (1024 * 1024)).toFixed(0)}MB
                    </p>
                  </div>
                </div>

                {!existingDoc ? (
                  <DocumentUploader
                    requirement={{
                      id: docType.id,
                      name: docType.name,
                      description: docType.description,
                      required: docType.isRequired,
                      acceptedFormats: docType.acceptedFormats,
                      maxSize: docType.maxSize
                    }}
                    onUpload={async (file) => {
                      try {
                        await handleDocumentUploadSuccess(file, docType.id);
                        return { success: true };
                      } catch (error) {
                        return { 
                          success: false, 
                          error: error instanceof Error ? error.message : 'Error al subir documento' 
                        };
                      }
                    }}
                    onRemove={() => handleDocumentRemove(docType.id)}
                    className="mt-3"
                  />
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {existingDoc.file?.name || 'Documento subido'}
                          </p>
                          <p className="text-xs text-green-600">
                            {existingDoc.file && `${(existingDoc.file.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDocumentRemove(docType.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">Subiendo documento...</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {uploadedCount < requiredCount && (
          <Alert variant="warning" className="mt-6">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium">Documentos pendientes</p>
                <p className="text-sm">
                  Debes subir todos los documentos requeridos para continuar con el registro.
                </p>
              </div>
            </div>
          </Alert>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        {onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
        )}
        
        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading || !validateForm()}
          className="px-6 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          {isLoading ? 'Validando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}