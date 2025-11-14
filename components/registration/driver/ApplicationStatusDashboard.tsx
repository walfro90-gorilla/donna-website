// components/registration/driver/ApplicationStatusDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui';
import type { 
  DriverApplicationStatus, 
  DriverApplicationStatusInfo, 
  DriverDocumentType,
  BackgroundCheckStatus 
} from '@/types/form';

export interface ApplicationStatusDashboardProps {
  applicationId: string;
  onDocumentResubmit?: (documentType: DriverDocumentType) => void;
  onRefresh?: () => void;
}

interface StatusStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  icon: string;
  estimatedDuration?: string;
  completedAt?: string;
  failureReason?: string;
}

const getStatusSteps = (statusInfo: DriverApplicationStatusInfo): StatusStep[] => {
  const baseSteps: StatusStep[] = [
    {
      id: 'application_submitted',
      title: 'Solicitud Enviada',
      description: 'Tu solicitud ha sido recibida y está en cola para revisión',
      status: 'completed',
      icon: '📝',
      completedAt: statusInfo.lastUpdated
    },
    {
      id: 'documents_review',
      title: 'Revisión de Documentos',
      description: 'Nuestro equipo está verificando todos tus documentos',
      status: statusInfo.status === 'documents_pending' ? 'failed' : 
             statusInfo.status === 'under_review' || statusInfo.status === 'background_check_pending' || statusInfo.status === 'approved' ? 'completed' : 'in_progress',
      icon: '📄',
      estimatedDuration: '1-3 días hábiles',
      failureReason: statusInfo.status === 'documents_pending' ? 'Algunos documentos necesitan ser resubidos' : undefined
    },
    {
      id: 'background_check',
      title: 'Verificación de Antecedentes',
      description: 'Verificación de antecedentes penales y historial de conducir',
      status: statusInfo.status === 'background_check_pending' ? 'in_progress' :
             statusInfo.status === 'approved' ? 'completed' :
             statusInfo.status === 'rejected' ? 'failed' : 'pending',
      icon: '🔍',
      estimatedDuration: '5-7 días hábiles',
      failureReason: statusInfo.status === 'rejected' ? 'La verificación de antecedentes no fue aprobada' : undefined
    },
    {
      id: 'final_approval',
      title: 'Aprobación Final',
      description: 'Revisión final y activación de tu cuenta de repartidor',
      status: statusInfo.status === 'approved' ? 'completed' :
             statusInfo.status === 'rejected' ? 'failed' : 'pending',
      icon: '✅',
      estimatedDuration: '1-2 días hábiles',
      failureReason: statusInfo.status === 'rejected' ? 'La solicitud no cumple con todos los requisitos' : undefined
    }
  ];

  return baseSteps;
};

const getStatusColor = (status: DriverApplicationStatus): string => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'under_review':
    case 'background_check_pending':
      return 'bg-blue-100 text-blue-800';
    case 'documents_pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'on_hold':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: DriverApplicationStatus): string => {
  switch (status) {
    case 'approved':
      return '✅';
    case 'rejected':
      return '❌';
    case 'under_review':
      return '👀';
    case 'background_check_pending':
      return '🔍';
    case 'documents_pending':
      return '📄';
    case 'on_hold':
      return '⏸️';
    default:
      return '📋';
  }
};

const getStatusMessage = (status: DriverApplicationStatus): string => {
  switch (status) {
    case 'approved':
      return '¡Felicidades! Tu solicitud ha sido aprobada';
    case 'rejected':
      return 'Tu solicitud no fue aprobada';
    case 'under_review':
      return 'Tu solicitud está siendo revisada';
    case 'background_check_pending':
      return 'Verificación de antecedentes en proceso';
    case 'documents_pending':
      return 'Se requieren documentos adicionales';
    case 'on_hold':
      return 'Tu solicitud está en espera';
    default:
      return 'Estado de solicitud';
  }
};

// Mock function to simulate fetching status - in real implementation, this would call an API
const fetchApplicationStatus = async (applicationId: string): Promise<DriverApplicationStatusInfo> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in real implementation, this would come from the backend
  return {
    status: 'background_check_pending',
    statusMessage: 'Tu verificación de antecedentes está en proceso. Te notificaremos cuando esté completa.',
    nextSteps: [
      'Esperar la finalización de la verificación de antecedentes',
      'Revisar tu correo electrónico para actualizaciones',
      'Mantener tus documentos actualizados'
    ],
    estimatedTimeToApproval: '3-5 días hábiles',
    documentsNeeded: [],
    rejectionReasons: [],
    canResubmit: false,
    lastUpdated: new Date().toISOString()
  };
};

export default function ApplicationStatusDashboard({
  applicationId,
  onDocumentResubmit,
  onRefresh
}: ApplicationStatusDashboardProps) {
  const [statusInfo, setStatusInfo] = useState<DriverApplicationStatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplicationStatus();
  }, [applicationId]);

  const loadApplicationStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await fetchApplicationStatus(applicationId);
      setStatusInfo(status);
    } catch (err) {
      setError('Error al cargar el estado de la solicitud');
      console.error('Error loading application status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadApplicationStatus();
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !statusInfo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card variant="outline" className="p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error al Cargar Estado
          </h3>
          <p className="text-gray-600 mb-4">
            {error || 'No se pudo cargar la información de tu solicitud'}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors"
          >
            Intentar de Nuevo
          </button>
        </Card>
      </div>
    );
  }

  const statusSteps = getStatusSteps(statusInfo);
  const currentStep = statusSteps.find(step => step.status === 'in_progress') || statusSteps[statusSteps.length - 1];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Estado de tu Solicitud
          </h2>
          <p className="text-gray-600">
            ID de Solicitud: <span className="font-mono">{applicationId}</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Current Status Card */}
      <Card variant="primary" className="p-6">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{getStatusIcon(statusInfo.status)}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {getStatusMessage(statusInfo.status)}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(statusInfo.status)}`}>
                {statusInfo.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mb-3">{statusInfo.statusMessage}</p>
            {statusInfo.estimatedTimeToApproval && (
              <p className="text-sm text-blue-600">
                ⏱️ Tiempo estimado restante: {statusInfo.estimatedTimeToApproval}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Progress Steps */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Progreso de tu Solicitud
        </h3>
        <div className="space-y-4">
          {statusSteps.map((step, index) => (
            <Card key={step.id} variant="outline" className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                    step.status === 'failed' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? '✓' :
                     step.status === 'in_progress' ? '⏳' :
                     step.status === 'failed' ? '✗' :
                     step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    {step.status === 'in_progress' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        En Proceso
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                  
                  {step.estimatedDuration && step.status !== 'completed' && (
                    <p className="text-xs text-gray-500">
                      Duración estimada: {step.estimatedDuration}
                    </p>
                  )}
                  
                  {step.completedAt && step.status === 'completed' && (
                    <p className="text-xs text-green-600">
                      Completado: {new Date(step.completedAt).toLocaleDateString('es-MX')}
                    </p>
                  )}
                  
                  {step.failureReason && step.status === 'failed' && (
                    <p className="text-xs text-red-600 mt-1">
                      {step.failureReason}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      {statusInfo.nextSteps.length > 0 && (
        <Card variant="outline" className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Próximos Pasos
          </h3>
          <ul className="space-y-2">
            {statusInfo.nextSteps.map((step, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-[#e4007c] mt-1">•</span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Documents Needed (if any) */}
      {statusInfo.documentsNeeded && statusInfo.documentsNeeded.length > 0 && (
        <Card variant="outline" className="p-6 border-yellow-200 bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">
            Documentos Requeridos
          </h3>
          <p className="text-yellow-800 mb-4">
            Los siguientes documentos necesitan ser resubidos o proporcionados:
          </p>
          <div className="space-y-2">
            {statusInfo.documentsNeeded.map((docType, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span className="text-gray-900">{docType.replace('_', ' ').toUpperCase()}</span>
                {onDocumentResubmit && (
                  <button
                    onClick={() => onDocumentResubmit(docType)}
                    className="px-3 py-1 bg-[#e4007c] text-white text-sm rounded hover:bg-[#c6006b] transition-colors"
                  >
                    Resubir
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rejection Reasons (if any) */}
      {statusInfo.rejectionReasons && statusInfo.rejectionReasons.length > 0 && (
        <Card variant="outline" className="p-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            Motivos de Rechazo
          </h3>
          <ul className="space-y-2">
            {statusInfo.rejectionReasons.map((reason, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">•</span>
                <span className="text-red-800">{reason}</span>
              </li>
            ))}
          </ul>
          {statusInfo.canResubmit && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
              <p className="text-red-800 text-sm">
                Puedes corregir estos problemas y volver a enviar tu solicitud.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Contact Support */}
      <Card variant="outline" className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ¿Necesitas Ayuda?
        </h3>
        <p className="text-gray-600 mb-4">
          Si tienes preguntas sobre tu solicitud o necesitas asistencia, no dudes en contactarnos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:soporte@donarepartos.com"
            className="px-4 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors text-center"
          >
            Enviar Correo
          </a>
          <a
            href="tel:+525555555555"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Llamar Soporte
          </a>
        </div>
      </Card>
    </div>
  );
}