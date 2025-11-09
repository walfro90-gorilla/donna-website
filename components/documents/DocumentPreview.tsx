// components/documents/DocumentPreview.tsx
"use client";

import { useState } from 'react';
import { Modal, Badge } from '@/components/ui';
import { UploadedDocument } from './DocumentUploader';

export interface DocumentPreviewProps {
  document: UploadedDocument;
  onClose?: () => void;
  onApprove?: (documentId: string) => void;
  onReject?: (documentId: string, reason: string) => void;
  showActions?: boolean;
  className?: string;
}

export default function DocumentPreview({
  document,
  onClose,
  onApprove,
  onReject,
  showActions = false,
  className = '',
}: DocumentPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (type.includes('image')) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (type.includes('word') || type.includes('document')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="success">Subido</Badge>;
      case 'processing':
        return <Badge variant="warning">Procesando</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      case 'uploading':
        return <Badge variant="info">Subiendo</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(document.id);
    }
  };

  const handleReject = () => {
    if (onReject && rejectionReason.trim()) {
      onReject(document.id, rejectionReason);
      setShowRejectionForm(false);
      setRejectionReason('');
    }
  };

  const renderPreviewContent = () => {
    if (document.type.includes('image')) {
      return (
        <div className="text-center">
          <img
            src={document.url || URL.createObjectURL(document.file)}
            alt={document.name}
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (document.type.includes('pdf')) {
      return (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-24 h-24 mx-auto bg-red-100 rounded-lg">
            {getFileIcon(document.type)}
          </div>
          <p className="text-gray-600">
            Vista previa de PDF no disponible. 
            {document.url && (
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e4007c] hover:text-[#c6006b] ml-1"
              >
                Abrir en nueva pestaña
              </a>
            )}
          </p>
        </div>
      );
    }

    return (
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center w-24 h-24 mx-auto bg-gray-100 rounded-lg">
          {getFileIcon(document.type)}
        </div>
        <p className="text-gray-600">
          Vista previa no disponible para este tipo de archivo.
        </p>
      </div>
    );
  };

  return (
    <>
      {/* Document Card */}
      <div className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-start space-x-4">
          {/* File Icon */}
          <div className="flex-shrink-0">
            {getFileIcon(document.type)}
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {document.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(document.size)} • {document.type}
                </p>
                {document.metadata?.uploadedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Subido: {formatDate(document.metadata.uploadedAt)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {getStatusBadge(document.status)}
              </div>
            </div>

            {/* Progress Bar for Uploading */}
            {document.status === 'uploading' && document.progress !== undefined && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#e4007c] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${document.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{document.progress}%</p>
              </div>
            )}

            {/* Error Message */}
            {document.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {document.error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-3 mt-3">
              {document.url && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-[#e4007c] hover:text-[#c6006b] text-xs font-medium"
                >
                  Vista previa
                </button>
              )}
              
              {document.url && (
                <a
                  href={document.url}
                  download={document.name}
                  className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                >
                  Descargar
                </a>
              )}

              {showActions && document.status === 'uploaded' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="text-green-600 hover:text-green-800 text-xs font-medium"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => setShowRejectionForm(true)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={document.name}
        size="lg"
      >
        <div className="space-y-4">
          {/* Document Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Tamaño:</dt>
                <dd className="text-gray-900">{formatFileSize(document.size)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Tipo:</dt>
                <dd className="text-gray-900">{document.type}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Estado:</dt>
                <dd>{getStatusBadge(document.status)}</dd>
              </div>
              {document.metadata?.uploadedAt && (
                <div>
                  <dt className="font-medium text-gray-500">Fecha:</dt>
                  <dd className="text-gray-900">{formatDate(document.metadata.uploadedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Preview Content */}
          <div className="border border-gray-200 rounded-lg p-6 min-h-64">
            {renderPreviewContent()}
          </div>

          {/* Modal Actions */}
          {showActions && document.status === 'uploaded' && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowRejectionForm(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                Rechazar
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Aprobar
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Rejection Form Modal */}
      <Modal
        isOpen={showRejectionForm}
        onClose={() => {
          setShowRejectionForm(false);
          setRejectionReason('');
        }}
        title="Rechazar Documento"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Por favor, proporciona una razón para rechazar este documento:
          </p>
          
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explica por qué este documento no es válido..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
          />
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowRejectionForm(false);
                setRejectionReason('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rechazar Documento
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}