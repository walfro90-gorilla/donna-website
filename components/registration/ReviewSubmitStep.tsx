// components/registration/ReviewSubmitStep.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import { Card, Alert, Badge } from '@/components/ui';
import type { BusinessInformation } from './BusinessInformationStep';
import type { LocationAddress } from './LocationAddressStep';
import type { LegalDocumentation } from './LegalDocumentationStep';
import type { BrandingMedia } from './BrandingMediaStep';
import type { MenuCreation } from './MenuCreationStep';

export interface ReviewSubmitData {
  businessInfo: Partial<BusinessInformation>;
  location: Partial<LocationAddress>;
  legal: Partial<LegalDocumentation>;
  branding: Partial<BrandingMedia>;
  menu: Partial<MenuCreation>;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingOptIn: boolean;
  submissionNotes?: string;
}

export interface ReviewSubmitStepProps {
  data: ReviewSubmitData;
  onDataChange: (data: Partial<ReviewSubmitData>) => void;
  onSubmit: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export default function ReviewSubmitStep({
  data,
  onDataChange,
  onSubmit,
  onPrevious,
  isLoading = false,
  errors = {}
}: ReviewSubmitStepProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleInputChange = useCallback((field: keyof ReviewSubmitData, value: any) => {
    onDataChange({ [field]: value });
  }, [onDataChange]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Validation and completeness checks
  const validationResults = useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Business Information validation
    if (!data.businessInfo?.businessName) issues.push('Nombre del negocio requerido');
    if (!data.businessInfo?.businessType) issues.push('Tipo de negocio requerido');
    if (!data.businessInfo?.phone) issues.push('Teléfono requerido');
    if (!data.businessInfo?.email) issues.push('Email requerido');
    
    // Location validation
    if (!data.location?.street) issues.push('Dirección requerida');
    if (!data.location?.city) issues.push('Ciudad requerida');
    if (!data.location?.postalCode) issues.push('Código postal requerido');
    
    // Legal documentation validation
    if (!data.legal?.businessLegalName) issues.push('Razón social requerida');
    if (!data.legal?.taxId) issues.push('RFC requerido');
    const requiredDocs = ['business_license', 'tax_id', 'health_permit', 'fire_permit', 'identity_document', 'proof_of_address'];
    const uploadedDocs = data.legal?.documents?.filter(doc => doc.status === 'uploaded').map(doc => doc.type) || [];
    const missingDocs = requiredDocs.filter(docType => !uploadedDocs.includes(docType as any));
    if (missingDocs.length > 0) issues.push(`Documentos faltantes: ${missingDocs.length}`);
    
    // Branding validation
    if (!data.branding?.logo) issues.push('Logo requerido');
    if (!data.branding?.brandColors?.primary) warnings.push('Colores de marca no definidos');
    
    // Menu validation
    const menuItemCount = data.menu?.menuItems?.length || 0;
    if (menuItemCount < 15) issues.push(`Menú incompleto: ${menuItemCount}/15 platillos mínimos`);
    
    // Terms validation
    if (!data.termsAccepted) issues.push('Debe aceptar los términos y condiciones');
    if (!data.privacyAccepted) issues.push('Debe aceptar la política de privacidad');
    
    return {
      issues,
      warnings,
      isValid: issues.length === 0,
      completeness: Math.round(((5 - issues.length) / 5) * 100)
    };
  }, [data]);

  const handleSubmit = useCallback(() => {
    if (validationResults.isValid) {
      setShowConfirmation(true);
    }
  }, [validationResults.isValid]);

  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmation(false);
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Revisión y Envío
        </h2>
        <p className="text-gray-600">
          Revisa toda la información antes de enviar tu solicitud de registro
        </p>
        <div className="mt-4">
          <Badge variant={validationResults.isValid ? 'success' : 'warning'}>
            {validationResults.completeness}% completado
          </Badge>
        </div>
      </div>

      {/* Validation Issues */}
      {!validationResults.isValid && (
        <Alert variant="error">
          <div className="space-y-2">
            <p className="font-medium">Información requerida faltante:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationResults.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {validationResults.warnings.length > 0 && (
        <Alert variant="warning">
          <div className="space-y-2">
            <p className="font-medium">Recomendaciones:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationResults.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {/* Registration Summary */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Resumen del Registro
          </h3>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSections.has('summary') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('summary') && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.businessInfo?.businessName ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Información del Negocio</div>
              <div className="text-xs text-gray-500 mt-1">
                {data.businessInfo?.businessType || 'No especificado'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.location?.street ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Ubicación</div>
              <div className="text-xs text-gray-500 mt-1">
                {data.location?.city || 'No especificada'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {(data.legal?.documents?.filter(doc => doc.status === 'uploaded').length || 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Documentos Subidos</div>
              <div className="text-xs text-gray-500 mt-1">
                de 6 requeridos
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.menu?.menuItems?.length || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Platillos en Menú</div>
              <div className="text-xs text-gray-500 mt-1">
                mínimo 15 requeridos
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Business Information Review */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('business')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Información del Negocio
          </h3>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSections.has('business') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('business') && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre del Negocio</label>
                <p className="text-gray-900">{data.businessInfo?.businessName || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de Negocio</label>
                <p className="text-gray-900">{data.businessInfo?.businessType || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-gray-900">{data.businessInfo?.phone || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{data.businessInfo?.email || 'No especificado'}</p>
              </div>
            </div>
            
            {data.businessInfo?.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <p className="text-gray-900">{data.businessInfo.description}</p>
              </div>
            )}
            
            {data.businessInfo?.cuisine && data.businessInfo.cuisine.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Tipos de Cocina</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.businessInfo.cuisine.map((cuisine, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Location Review */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('location')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Ubicación
          </h3>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSections.has('location') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('location') && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección Completa</label>
              <p className="text-gray-900">
                {data.location?.formattedAddress || 
                 `${data.location?.street || ''} ${data.location?.number || ''}, ${data.location?.neighborhood || ''}, ${data.location?.city || ''}, ${data.location?.state || ''} ${data.location?.postalCode || ''}`}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de Ubicación</label>
                <p className="text-gray-900">{data.location?.addressType || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estacionamiento</label>
                <p className="text-gray-900">
                  {data.location?.hasParking ? `Sí (${data.location.parkingSpaces || 'N/A'} espacios)` : 'No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Acceso para Delivery</label>
                <p className="text-gray-900">{data.location?.hasDeliveryAccess ? 'Sí' : 'No'}</p>
              </div>
            </div>
            
            {data.location?.operatingZones && data.location.operatingZones.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Zonas de Operación</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.location.operatingZones.map((zone, index) => (
                    <Badge key={index} variant="info" size="sm">
                      {zone}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>   
   {/* Legal Documentation Review */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('legal')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Documentación Legal
          </h3>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSections.has('legal') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('legal') && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Razón Social</label>
                <p className="text-gray-900">{data.legal?.businessLegalName || 'No especificada'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">RFC</label>
                <p className="text-gray-900">{data.legal?.taxId || 'No especificado'}</p>
              </div>
            </div>
            
            {data.legal?.legalRepresentative && (
              <div>
                <label className="text-sm font-medium text-gray-700">Representante Legal</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{data.legal.legalRepresentative.name}</p>
                  <p className="text-sm text-gray-600">{data.legal.legalRepresentative.position}</p>
                  <p className="text-sm text-gray-600">{data.legal.legalRepresentative.email}</p>
                  <p className="text-sm text-gray-600">{data.legal.legalRepresentative.phone}</p>
                </div>
              </div>
            )}
            
            {data.legal?.documents && data.legal.documents.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Documentos Subidos</label>
                <div className="mt-2 space-y-2">
                  {data.legal.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          doc.status === 'uploaded' ? 'bg-green-500' : 
                          doc.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">
                            Estado: {doc.status === 'uploaded' ? 'Subido' : 
                                   doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={doc.status === 'uploaded' ? 'success' : 
                               doc.status === 'rejected' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {doc.isRequired ? 'Requerido' : 'Opcional'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Branding Review */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('branding')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Imagen de Marca
          </h3>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSections.has('branding') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('branding') && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.branding?.logo && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Logo</label>
                  <div className="mt-2">
                    <img 
                      src={data.branding.logo} 
                      alt="Logo del restaurante" 
                      className="w-24 h-24 object-contain bg-gray-50 rounded-lg border"
                    />
                  </div>
                </div>
              )}
              
              {data.branding?.coverImage && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Imagen de Portada</label>
                  <div className="mt-2">
                    <img 
                      src={data.branding.coverImage} 
                      alt="Imagen de portada" 
                      className="w-full h-24 object-cover bg-gray-50 rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {data.branding?.brandDescription && (
              <div>
                <label className="text-sm font-medium text-gray-700">Descripción de la Marca</label>
                <p className="text-gray-900 mt-1">{data.branding.brandDescription}</p>
              </div>
            )}
            
            {data.branding?.slogan && (
              <div>
                <label className="text-sm font-medium text-gray-700">Eslogan</label>
                <p className="text-gray-900 mt-1 italic">"{data.branding.slogan}"</p>
              </div>
            )}
            
            {data.branding?.brandColors && (
              <div>
                <label className="text-sm font-medium text-gray-700">Colores de Marca</label>
                <div className="flex space-x-4 mt-2">
                  {data.branding.brandColors.primary && (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: data.branding.brandColors.primary }}
                      ></div>
                      <span className="text-sm text-gray-600">Primario</span>
                    </div>
                  )}
                  {data.branding.brandColors.secondary && (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: data.branding.brandColors.secondary }}
                      ></div>
                      <span className="text-sm text-gray-600">Secundario</span>
                    </div>
                  )}
                  {data.branding.brandColors.accent && (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: data.branding.brandColors.accent }}
                      ></div>
                      <span className="text-sm text-gray-600">Acento</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {data.branding?.galleryImages && data.branding.galleryImages.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Galería ({data.branding.galleryImages.length} imágenes)
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                  {data.branding.galleryImages.slice(0, 6).map((image, index) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`Galería ${index + 1}`} 
                      className="w-full h-16 object-cover rounded-lg"
                    />
                  ))}
                  {data.branding.galleryImages.length > 6 && (
                    <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        +{data.branding.galleryImages.length - 6}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Menu Review */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection('menu')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Menú del Restaurante
          </h3>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSections.has('menu') ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.has('menu') && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {data.menu?.menuItems?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Platillos totales</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data.menu?.menuItems?.filter(item => item.available).length || 0}
                </div>
                <div className="text-sm text-gray-600">Disponibles</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.menu?.categories?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Categorías</div>
              </div>
            </div>
            
            {data.menu?.categories && data.menu.categories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Categorías del Menú</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.menu.categories.map((category, index) => (
                    <Badge key={index} variant="info" size="sm">
                      {category.name} ({data.menu?.menuItems?.filter(item => item.category === category.id).length || 0})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {data.menu?.menuItems && data.menu.menuItems.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Platillos Destacados (primeros 6)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {data.menu.menuItems.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                          <span className="text-lg font-bold text-[#e4007c] ml-2">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {!item.available && (
                            <Badge variant="secondary" size="sm">No disponible</Badge>
                          )}
                          {item.preparationTime && (
                            <span className="text-xs text-gray-500">
                              ⏱️ {item.preparationTime} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {data.menu.menuItems.length > 6 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    ... y {data.menu.menuItems.length - 6} platillos más
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Terms and Conditions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Términos y Condiciones
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="termsAccepted"
              checked={data.termsAccepted}
              onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
              className="h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded mt-1"
            />
            <div className="flex-1">
              <label htmlFor="termsAccepted" className="text-sm font-medium text-gray-700">
                Acepto los Términos y Condiciones de Servicio *
              </label>
              <p className="text-xs text-gray-500 mt-1">
                He leído y acepto los{' '}
                <a href="/terms" target="_blank" className="text-[#e4007c] hover:underline">
                  términos y condiciones
                </a>{' '}
                para operar como socio restaurantero en la plataforma.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="privacyAccepted"
              checked={data.privacyAccepted}
              onChange={(e) => handleInputChange('privacyAccepted', e.target.checked)}
              className="h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded mt-1"
            />
            <div className="flex-1">
              <label htmlFor="privacyAccepted" className="text-sm font-medium text-gray-700">
                Acepto la Política de Privacidad *
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Autorizo el tratamiento de mis datos personales conforme a la{' '}
                <a href="/privacy" target="_blank" className="text-[#e4007c] hover:underline">
                  política de privacidad
                </a>.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="marketingOptIn"
              checked={data.marketingOptIn}
              onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
              className="h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded mt-1"
            />
            <div className="flex-1">
              <label htmlFor="marketingOptIn" className="text-sm font-medium text-gray-700">
                Deseo recibir comunicaciones promocionales (opcional)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Acepto recibir ofertas especiales, tips de negocio y actualizaciones por email y SMS.
              </p>
            </div>
          </div>
        </div>
        
        {(errors.termsAccepted || errors.privacyAccepted) && (
          <Alert variant="error" className="mt-4">
            <p className="text-sm">
              Debes aceptar los términos y condiciones y la política de privacidad para continuar.
            </p>
          </Alert>
        )}
      </Card>

      {/* Additional Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notas Adicionales (Opcional)
        </h3>
        
        <div>
          <label htmlFor="submissionNotes" className="block text-sm font-medium text-gray-700 mb-2">
            ¿Hay algo más que quieras que sepamos sobre tu restaurante?
          </label>
          <textarea
            id="submissionNotes"
            value={data.submissionNotes || ''}
            onChange={(e) => handleInputChange('submissionNotes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
            placeholder="Comparte información adicional sobre tu restaurante, especialidades, historia, o cualquier detalle que consideres importante..."
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {(data.submissionNotes || '').length}/1000 caracteres
          </p>
        </div>
      </Card>

      {/* Final Validation Summary */}
      {validationResults.isValid && (
        <Alert variant="success">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">¡Tu registro está completo!</p>
              <p className="text-sm mt-1">
                Toda la información requerida ha sido proporcionada. Puedes proceder con el envío de tu solicitud.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-[#e4007c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar Envío de Registro
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Estás a punto de enviar tu solicitud de registro como socio restaurantero. 
                Una vez enviada, nuestro equipo revisará tu información y documentos.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">¿Qué sigue después?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Revisión de documentos (1-2 días hábiles)</li>
                  <li>• Verificación de información (1-2 días hábiles)</li>
                  <li>• Aprobación y activación de cuenta</li>
                  <li>• Configuración de pagos y comisiones</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enviando...' : 'Confirmar Envío'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          onClick={handleSubmit}
          disabled={isLoading || !validationResults.isValid}
          className="px-8 py-3 text-base font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed ml-auto flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Enviando Registro...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Enviar Registro</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}