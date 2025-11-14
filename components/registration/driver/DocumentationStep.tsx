// components/registration/driver/DocumentationStep.tsx
"use client";

import { useState } from 'react';
import FormField from '@/components/FormField';
import ErrorMessage from '@/components/ErrorMessage';
import { DocumentUploader } from '@/components/documents';
import { Card, CardContent } from '@/components/ui';
import type { StepProps } from '@/components/forms/StepperForm';
import type { CompleteDeliveryDriverRegistration, DriverDocument, DriverDocumentType } from '@/types/form';

export interface DocumentationStepProps extends StepProps {
  data: CompleteDeliveryDriverRegistration;
  onDataChange: (data: Partial<CompleteDeliveryDriverRegistration>) => void;
}

interface DocumentRequirement {
  type: DriverDocumentType;
  title: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number;
  icon: string;
  helpText?: string;
}

const getDocumentRequirements = (vehicleType?: string): DocumentRequirement[] => {
  const baseRequirements: DocumentRequirement[] = [
    {
      type: 'identity_document_front',
      title: 'Identificación Oficial (Frente)',
      description: 'INE, pasaporte o cédula profesional',
      required: true,
      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSize: 5 * 1024 * 1024, // 5MB
      icon: '🆔',
      helpText: 'Asegúrate de que todos los datos sean legibles'
    },
    {
      type: 'identity_document_back',
      title: 'Identificación Oficial (Reverso)',
      description: 'Parte trasera de tu identificación',
      required: true,
      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSize: 5 * 1024 * 1024,
      icon: '🆔',
      helpText: 'Incluye la parte trasera si aplica'
    },
    {
      type: 'profile_photo',
      title: 'Foto de Perfil',
      description: 'Foto reciente tuya para verificación',
      required: true,
      acceptedFormats: ['image/jpeg', 'image/png'],
      maxSize: 3 * 1024 * 1024, // 3MB
      icon: '📸',
      helpText: 'Foto clara de tu rostro, sin lentes oscuros'
    }
  ];

  // Add vehicle-specific requirements
  if (vehicleType && vehicleType !== 'bicycle') {
    baseRequirements.push(
      {
        type: 'driver_license_front',
        title: 'Licencia de Conducir (Frente)',
        description: 'Licencia vigente para el tipo de vehículo',
        required: true,
        acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        icon: '🪪',
        helpText: 'Debe estar vigente y corresponder al tipo de vehículo'
      },
      {
        type: 'driver_license_back',
        title: 'Licencia de Conducir (Reverso)',
        description: 'Parte trasera de la licencia',
        required: true,
        acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        icon: '🪪'
      },
      {
        type: 'vehicle_registration',
        title: 'Tarjeta de Circulación',
        description: 'Registro vehicular vigente',
        required: true,
        acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        icon: '📄',
        helpText: 'Debe coincidir con los datos del vehículo proporcionados'
      },
      {
        type: 'insurance_proof',
        title: 'Comprobante de Seguro',
        description: 'Póliza de seguro vigente',
        required: vehicleType === 'motorcycle' || vehicleType === 'car' || vehicleType === 'scooter',
        acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        icon: '🛡️',
        helpText: 'Debe estar vigente durante todo el período de trabajo'
      },
      {
        type: 'vehicle_photo',
        title: 'Foto del Vehículo',
        description: 'Foto clara de tu vehículo con placas visibles',
        required: true,
        acceptedFormats: ['image/jpeg', 'image/png'],
        maxSize: 5 * 1024 * 1024,
        icon: '📷',
        helpText: 'Incluye una vista donde se vean claramente las placas'
      }
    );
  }

  return baseRequirements;
};

export default function DocumentationStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading,
  errors,
}: DocumentationStepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());

  const documentRequirements = getDocumentRequirements(data.vehicleInfo?.vehicleType);

  const handleInputChange = (field: string, value: string | boolean) => {
    onDataChange({ 
      documentation: {
        ...data.documentation,
        [field]: value
      }
    });
    
    // Clear local error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDocumentUpload = async (documentType: DriverDocumentType, file: File): Promise<void> => {
    setUploadingDocuments(prev => new Set([...prev, documentType]));
    
    try {
      // Simulate upload - in real implementation, this would upload to Supabase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument: DriverDocument = {
        id: `${documentType}_${Date.now()}`,
        type: documentType,
        filename: file.name,
        url: URL.createObjectURL(file), // In real implementation, this would be the Supabase URL
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      };

      const updatedDocuments = [
        ...data.documentation.documents.filter(doc => doc.type !== documentType),
        newDocument
      ];

      onDataChange({ 
        documentation: {
          ...data.documentation,
          documents: updatedDocuments
        }
      });

      // Update specific flags based on document type
      if (documentType === 'driver_license_front' || documentType === 'driver_license_back') {
        onDataChange({ 
          documentation: {
            ...data.documentation,
            hasDriverLicense: true
          }
        });
      } else if (documentType === 'vehicle_registration') {
        onDataChange({ 
          documentation: {
            ...data.documentation,
            hasVehicleRegistration: true
          }
        });
      } else if (documentType === 'insurance_proof') {
        onDataChange({ 
          documentation: {
            ...data.documentation,
            hasInsuranceProof: true
          }
        });
      } else if (documentType === 'identity_document_front' || documentType === 'identity_document_back') {
        onDataChange({ 
          documentation: {
            ...data.documentation,
            hasIdentityDocument: true
          }
        });
      }

    } catch (error) {
      console.error('Error uploading document:', error);
      setLocalErrors(prev => ({
        ...prev,
        [documentType]: 'Error al subir el documento. Inténtalo de nuevo.'
      }));
    } finally {
      setUploadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentType);
        return newSet;
      });
    }
  };

  const handleDocumentRemove = (documentType: DriverDocumentType) => {
    const updatedDocuments = data.documentation.documents.filter(doc => doc.type !== documentType);
    onDataChange({ 
      documentation: {
        ...data.documentation,
        documents: updatedDocuments
      }
    });

    // Update specific flags based on document type
    if (documentType === 'driver_license_front' || documentType === 'driver_license_back') {
      const hasOtherLicense = updatedDocuments.some(doc => 
        doc.type === 'driver_license_front' || doc.type === 'driver_license_back'
      );
      if (!hasOtherLicense) {
        onDataChange({ 
          documentation: {
            ...data.documentation,
            hasDriverLicense: false
          }
        });
      }
    } else if (documentType === 'vehicle_registration') {
      onDataChange({ 
        documentation: {
          ...data.documentation,
          hasVehicleRegistration: false
        }
      });
    } else if (documentType === 'insurance_proof') {
      onDataChange({ 
        documentation: {
          ...data.documentation,
          hasInsuranceProof: false
        }
      });
    } else if (documentType === 'identity_document_front' || documentType === 'identity_document_back') {
      const hasOtherIdentity = updatedDocuments.some(doc => 
        doc.type === 'identity_document_front' || doc.type === 'identity_document_back'
      );
      if (!hasOtherIdentity) {
        onDataChange({ 
          documentation: {
            ...data.documentation,
            hasIdentityDocument: false
          }
        });
      }
    }
  };

  const getUploadedDocument = (documentType: DriverDocumentType): DriverDocument | undefined => {
    return data.documentation.documents.find(doc => doc.type === documentType);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required documents
    const requiredDocs = documentRequirements.filter(req => req.required);
    
    for (const requirement of requiredDocs) {
      const uploadedDoc = getUploadedDocument(requirement.type);
      if (!uploadedDoc) {
        newErrors[requirement.type] = `${requirement.title} es requerido`;
      }
    }

    // Driver license validation for motorized vehicles
    if (data.vehicleInfo?.vehicleType && data.vehicleInfo.vehicleType !== 'bicycle') {
      if (!data.documentation.driverLicenseNumber?.trim()) {
        newErrors.driverLicenseNumber = 'El número de licencia es requerido';
      }
      if (!data.documentation.driverLicenseExpiry?.trim()) {
        newErrors.driverLicenseExpiry = 'La fecha de vencimiento de la licencia es requerida';
      } else {
        // Validate that license is not expired
        const expiryDate = new Date(data.documentation.driverLicenseExpiry);
        const today = new Date();
        if (expiryDate <= today) {
          newErrors.driverLicenseExpiry = 'La licencia debe estar vigente';
        }
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const allErrors = { ...localErrors, ...errors };
  const requiredDocuments = documentRequirements.filter(req => req.required);
  const uploadedRequiredDocs = requiredDocuments.filter(req => getUploadedDocument(req.type));
  const completionPercentage = Math.round((uploadedRequiredDocs.length / requiredDocuments.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Documentación Requerida
        </h3>
        <p className="text-gray-600 mb-6">
          Sube todos los documentos requeridos para verificar tu identidad y vehículo. 
          Asegúrate de que las imágenes sean claras y todos los datos sean legibles.
        </p>
        
        {/* Progress indicator */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progreso de documentos
            </span>
            <span className="text-sm text-gray-600">
              {uploadedRequiredDocs.length} de {requiredDocuments.length} documentos
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Driver License Information (for motorized vehicles) */}
      {data.vehicleInfo?.vehicleType && data.vehicleInfo.vehicleType !== 'bicycle' && (
        <div className="border-b pb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Información de la Licencia de Conducir
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Número de Licencia"
              id="driverLicenseNumber"
              type="text"
              value={data.documentation.driverLicenseNumber || ''}
              onChange={(e) => handleInputChange('driverLicenseNumber', e.target.value)}
              required
              placeholder="Número de licencia de conducir"
              error={allErrors.driverLicenseNumber}
            />

            <FormField
              label="Fecha de Vencimiento"
              id="driverLicenseExpiry"
              type="date"
              value={data.documentation.driverLicenseExpiry || ''}
              onChange={(e) => handleInputChange('driverLicenseExpiry', e.target.value)}
              required
              error={allErrors.driverLicenseExpiry}
              helpText="La licencia debe estar vigente"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      )}

      {/* Document Upload Section */}
      <div className="space-y-6">
        {documentRequirements.map((requirement) => {
          const uploadedDoc = getUploadedDocument(requirement.type);
          const isUploading = uploadingDocuments.has(requirement.type);
          
          return (
            <Card key={requirement.type} variant="outline" className="p-6">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{requirement.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {requirement.title}
                    </h4>
                    {requirement.required && (
                      <span className="text-red-500 text-sm">*</span>
                    )}
                    {uploadedDoc && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Subido
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {requirement.description}
                  </p>
                  
                  {requirement.helpText && (
                    <p className="text-blue-600 text-xs mb-3">
                      💡 {requirement.helpText}
                    </p>
                  )}

                  <DocumentUploader
                    requirement={{
                      id: requirement.type,
                      name: requirement.title,
                      description: requirement.description,
                      required: requirement.required,
                      acceptedFormats: requirement.acceptedFormats,
                      maxSize: requirement.maxSize,
                      validationRules: []
                    }}
                    onUpload={(file) => handleDocumentUpload(requirement.type, file)}
                    onRemove={() => handleDocumentRemove(requirement.type)}
                    existingDocument={uploadedDoc ? {
                      id: uploadedDoc.id,
                      filename: uploadedDoc.filename,
                      url: uploadedDoc.url,
                      status: uploadedDoc.status,
                      uploadedAt: uploadedDoc.uploadedAt,
                      type: uploadedDoc.type
                    } : undefined}
                    isLoading={isUploading}
                  />

                  {allErrors[requirement.type] && (
                    <p className="mt-2 text-sm text-red-600">
                      {allErrors[requirement.type]}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Information Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h5 className="font-medium text-yellow-900 mb-1">Consejos para subir documentos</h5>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Asegúrate de que las fotos sean claras y bien iluminadas</li>
              <li>• Todos los textos deben ser legibles</li>
              <li>• Los documentos deben estar vigentes</li>
              <li>• Evita reflejos o sombras en las fotos</li>
              <li>• Los datos deben coincidir con la información proporcionada</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {Object.keys(allErrors).length > 0 && (
        <ErrorMessage message="Por favor, sube todos los documentos requeridos antes de continuar." />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          disabled={isLoading}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <button
          onClick={handleNext}
          disabled={isLoading || completionPercentage < 100 || uploadingDocuments.size > 0}
          className="px-6 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Validando...' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}