// components/registration/driver/DocumentResubmission.tsx
"use client";

import { useState } from 'react';
import { DocumentUploader } from '@/components/documents';
import { Card, CardContent } from '@/components/ui';
import ErrorMessage from '@/components/ErrorMessage';
import type { DriverDocumentType, DriverDocument } from '@/types/form';

export interface DocumentResubmissionProps {
  applicationId: string;
  documentType: DriverDocumentType;
  rejectionReason?: string;
  currentDocument?: DriverDocument;
  onResubmit: (file: File, notes?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const getDocumentInfo = (documentType: DriverDocumentType) => {
  const documentMap = {
    driver_license_front: {
      title: 'Licencia de Conducir (Frente)',
      description: 'Parte frontal de tu licencia de conducir',
      icon: '🪪',
      tips: [
        'Asegúrate de que todos los datos sean legibles',
        'La licencia debe estar vigente',
        'Evita reflejos y sombras',
        'Incluye toda la licencia en la foto'
      ]
    },
    driver_license_back: {
      title: 'Licencia de Conducir (Reverso)',
      description: 'Parte trasera de tu licencia de conducir',
      icon: '🪪',
      tips: [
        'Incluye toda la parte trasera',
        'Los códigos de barras deben ser visibles',
        'Evita reflejos y sombras'
      ]
    },
    vehicle_registration: {
      title: 'Tarjeta de Circulación',
      description: 'Registro vehicular vigente',
      icon: '📄',
      tips: [
        'Debe coincidir con los datos del vehículo',
        'La tarjeta debe estar vigente',
        'Todos los datos deben ser legibles',
        'Incluye ambos lados si es necesario'
      ]
    },
    insurance_proof: {
      title: 'Comprobante de Seguro',
      description: 'Póliza de seguro vigente',
      icon: '🛡️',
      tips: [
        'El seguro debe estar vigente',
        'Debe incluir cobertura de responsabilidad civil',
        'Los datos del vehículo deben coincidir',
        'Incluye el número de póliza claramente'
      ]
    },
    identity_document_front: {
      title: 'Identificación Oficial (Frente)',
      description: 'INE, pasaporte o cédula profesional',
      icon: '🆔',
      tips: [
        'Debe ser una identificación oficial vigente',
        'Todos los datos deben ser legibles',
        'La foto debe ser clara',
        'Evita reflejos y sombras'
      ]
    },
    identity_document_back: {
      title: 'Identificación Oficial (Reverso)',
      description: 'Parte trasera de tu identificación',
      icon: '🆔',
      tips: [
        'Incluye toda la parte trasera',
        'Los códigos deben ser visibles',
        'Debe coincidir con la parte frontal'
      ]
    },
    vehicle_photo: {
      title: 'Foto del Vehículo',
      description: 'Foto clara de tu vehículo',
      icon: '📷',
      tips: [
        'Las placas deben ser claramente visibles',
        'Incluye una vista completa del vehículo',
        'La foto debe ser reciente',
        'Buena iluminación y enfoque'
      ]
    },
    profile_photo: {
      title: 'Foto de Perfil',
      description: 'Foto reciente tuya para verificación',
      icon: '📸',
      tips: [
        'Foto clara de tu rostro',
        'Sin lentes oscuros',
        'Buena iluminación',
        'Fondo neutro preferible'
      ]
    }
  };

  return documentMap[documentType] || {
    title: documentType.replace('_', ' ').toUpperCase(),
    description: 'Documento requerido',
    icon: '📄',
    tips: ['Asegúrate de que el documento sea claro y legible']
  };
};

export default function DocumentResubmission({
  applicationId,
  documentType,
  rejectionReason,
  currentDocument,
  onResubmit,
  onCancel,
  isLoading = false
}: DocumentResubmissionProps) {
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentInfo = getDocumentInfo(documentType);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      await onResubmit(file, notes.trim() || undefined);
    } catch (err) {
      setError('Error al subir el documento. Inténtalo de nuevo.');
      console.error('Error uploading document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">{documentInfo.icon}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Resubir Documento
        </h2>
        <h3 className="text-lg text-gray-700 mb-4">
          {documentInfo.title}
        </h3>
        <p className="text-gray-600">
          {documentInfo.description}
        </p>
      </div>

      {/* Rejection Reason */}
      {rejectionReason && (
        <Card variant="outline" className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <div className="text-red-500 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-red-900 mb-1">
                Motivo del Rechazo
              </h4>
              <p className="text-sm text-red-800">
                {rejectionReason}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Current Document (if exists) */}
      {currentDocument && (
        <Card variant="outline" className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Documento Actual
          </h4>
          <div className="flex items-center space-x-3">
            <div className="text-gray-400">📄</div>
            <div>
              <p className="text-sm text-gray-700">{currentDocument.filename}</p>
              <p className="text-xs text-gray-500">
                Subido: {new Date(currentDocument.uploadedAt).toLocaleDateString('es-MX')}
              </p>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              currentDocument.status === 'rejected' ? 'bg-red-100 text-red-800' :
              currentDocument.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {currentDocument.status === 'rejected' ? 'Rechazado' :
               currentDocument.status === 'pending' ? 'Pendiente' :
               currentDocument.status}
            </span>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card variant="outline" className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">
          💡 Consejos para una Subida Exitosa
        </h4>
        <ul className="space-y-1">
          {documentInfo.tips.map((tip, index) => (
            <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* File Upload */}
      <Card variant="outline" className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">
          Subir Nuevo Documento
        </h4>
        
        <DocumentUploader
          requirement={{
            id: documentType,
            name: documentInfo.title,
            description: documentInfo.description,
            required: true,
            acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
            maxSize: 5 * 1024 * 1024, // 5MB
            validationRules: []
          }}
          onUpload={handleFileUpload}
          onRemove={() => {}}
          isLoading={isUploading}
        />

        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
      </Card>

      {/* Additional Notes */}
      <Card variant="outline" className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">
          Notas Adicionales (Opcional)
        </h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Si tienes alguna explicación o comentario sobre el documento, puedes incluirlo aquí..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4007c] focus:border-transparent resize-none"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {notes.length}/500 caracteres
        </p>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={onCancel}
          disabled={isUploading}
          className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancelar
        </button>
        
        <button
          onClick={() => {
            // This would typically be handled by the DocumentUploader component
            // but we can provide a manual trigger if needed
          }}
          disabled={isUploading}
          className="flex-1 px-6 py-3 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isUploading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>
            {isUploading ? 'Subiendo...' : 'Subir Documento'}
          </span>
        </button>
      </div>

      {/* Help */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-gray-600 mb-2">
          ¿Tienes problemas para subir tu documento?
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="mailto:soporte@donarepartos.com"
            className="text-sm text-[#e4007c] hover:text-[#c6006b] transition-colors"
          >
            Contactar Soporte
          </a>
          <span className="hidden sm:inline text-gray-400">|</span>
          <a
            href="/ayuda/documentos"
            className="text-sm text-[#e4007c] hover:text-[#c6006b] transition-colors"
          >
            Ver Guía de Documentos
          </a>
        </div>
      </div>
    </div>
  );
}