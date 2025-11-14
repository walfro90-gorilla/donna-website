// app/socios/page.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useRestaurantValidation } from '@/lib/hooks/useRestaurantValidation';
import { type RegistrationStep } from '@/components/forms/StepperForm';
import { LazyRegistrationComponents, preloadUserTypeComponents } from '@/components/registration/lazy';
import { TimeoutHandler } from '@/components/ui';
import { retryWithBackoff, handleError } from '@/lib/utils/errorHandler';
import { registerRestaurantClient } from '@/lib/utils/registerRestaurant';
import { 
  createEmptyRegistration, 
  convertToLegacyFormat,
  type CompleteRestaurantRegistration 
} from '@/types/registration';
import { Alert } from '@/components/ui';
import AddressAutocompleteFixed from '@/components/AddressAutocompleteFixed';
import LocationConfirmationMapSmart from '@/components/LocationConfirmationMapSmart';
import { registerRestaurantAtomic } from '@/lib/utils/registerRestaurantAtomic';


// Icono para la sección de beneficios
const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function SociosPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');
  const [showMultiStep, setShowMultiStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    restaurantName: '',
    phone: '',
    address: '',
    addressPlaceData: null as any,
    lat: null as number | null,
    lon: null as number | null,
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showLocationMap, setShowLocationMap] = useState(false);
  
  const [termsAccepted, setTermsAccepted] = useState(false);

  const supabase = useSupabase();

  // Field validations
  const emailValidation = useRestaurantValidation('email', formData.email);
  const restaurantNameValidation = useRestaurantValidation('restaurantName', formData.restaurantName);

  // Preload restaurant components when component mounts
  useEffect(() => {
    preloadUserTypeComponents('restaurant');
  }, []);

  // Define the registration steps
  const registrationSteps: RegistrationStep[] = [
    {
      id: 'business-information',
      title: 'Información del Negocio',
      description: 'Cuéntanos sobre tu restaurante y detalles básicos',
      component: LazyRegistrationComponents.BusinessInformationStep,
      validation: async (data: CompleteRestaurantRegistration) => {
        const businessInfo = data.businessInfo || {};
        const errors: Record<string, string> = {};
        
        if (!businessInfo.businessName?.trim()) {
          errors.businessName = 'El nombre del negocio es requerido';
        }
        if (!businessInfo.businessType) {
          errors.businessType = 'El tipo de negocio es requerido';
        }
        if (!businessInfo.phone?.trim()) {
          errors.phone = 'El teléfono es requerido';
        }
        if (!businessInfo.email?.trim()) {
          errors.email = 'El email es requerido';
        }
        if (!businessInfo.ownerName?.trim()) {
          errors.ownerName = 'El nombre del propietario es requerido';
        }
        if (!businessInfo.password?.trim()) {
          errors.password = 'La contraseña es requerida';
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
    {
      id: 'location-address',
      title: 'Ubicación y Dirección',
      description: 'Proporciona la ubicación de tu restaurante',
      component: LazyRegistrationComponents.LocationAddressStep,
      validation: async (data: CompleteRestaurantRegistration) => {
        const locationAddress = data.locationAddress || {};
        const errors: Record<string, string> = {};
        
        if (!locationAddress.formattedAddress?.trim()) {
          errors.fullAddress = 'La dirección es requerida';
        }
        if (!locationAddress.coordinates?.lat || !locationAddress.coordinates?.lng) {
          errors.coordinates = 'Las coordenadas son requeridas';
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
    {
      id: 'legal-documentation',
      title: 'Documentación Legal',
      description: 'Sube los documentos requeridos para operar',
      component: LazyRegistrationComponents.LegalDocumentationStep,
      validation: async (data: CompleteRestaurantRegistration) => {
        const legalDocs = data.legalDocumentation || {};
        const errors: Record<string, string> = {};
        
        const requiredDocs = ['rfc', 'identificacion', 'certificado_bancario'];
        const uploadedDocs = (legalDocs.documents || []).map((doc) => doc.type);
        
        for (const docType of requiredDocs) {
          if (!uploadedDocs.includes(docType as never)) {
            errors[docType] = `El documento ${docType} es requerido`;
          }
        }
        
        if (!legalDocs.businessLegalName?.trim()) {
          errors.businessLegalName = 'La razón social es requerida';
        }
        
        if (!legalDocs.taxId?.trim()) {
          errors.taxId = 'El RFC es requerido';
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
    {
      id: 'branding-media',
      title: 'Imagen de Marca',
      description: 'Personaliza la apariencia de tu restaurante',
      component: LazyRegistrationComponents.BrandingMediaStep,
      validation: async (data: CompleteRestaurantRegistration) => {
        const branding = data.brandingMedia || {};
        const errors: Record<string, string> = {};
        
        if (!branding.logo) {
          errors.logo = 'El logo es requerido';
        }
        if (!branding.coverImage) {
          errors.coverImage = 'La imagen de portada es requerida';
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
    {
      id: 'menu-creation',
      title: 'Creación del Menú',
      description: 'Crea tu menú con al menos 15 platillos',
      component: LazyRegistrationComponents.MenuCreationStep,
      validation: async (data: CompleteRestaurantRegistration) => {
        const menu = data.menuCreation || {};
        const errors: Record<string, string> = {};
        
        const totalItems = (menu.menuItems || []).length;
        if (totalItems < 15) {
          errors.minItems = `Necesitas al menos 15 platillos. Tienes ${totalItems}`;
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
    {
      id: 'review-submit',
      title: 'Revisión y Envío',
      description: 'Revisa toda la información antes de enviar',
      component: ({ data, onDataChange, onNext, onPrevious, isLoading, errors }) => {
        const reviewSubmitData = data.reviewSubmit || {
          termsAccepted: false,
          privacyAccepted: false,
          marketingOptIn: false,
          submissionNotes: '',
        };

        const reviewData = {
          businessInfo: data.businessInfo || {},
          location: data.locationAddress || {},
          legal: data.legalDocumentation || {},
          branding: data.brandingMedia || {},
          menu: data.menuCreation || {},
          termsAccepted: reviewSubmitData.termsAccepted,
          privacyAccepted: reviewSubmitData.privacyAccepted,
          marketingOptIn: reviewSubmitData.marketingOptIn,
          submissionNotes: reviewSubmitData.submissionNotes,
        };

        const handleReviewDataChange = (updates: Partial<typeof reviewData>) => {
          onDataChange({
            ...data,
            reviewSubmit: {
              ...data.reviewSubmit,
              ...updates,
            },
          });
        };

        return (
          <LazyRegistrationComponents.ReviewSubmitStep
            data={reviewData}
            onDataChange={handleReviewDataChange}
            onSubmit={onNext}
            onPrevious={onPrevious}
            isLoading={isLoading}
            errors={errors}
          />
        );
      },
      validation: async (data: CompleteRestaurantRegistration) => {
        const reviewData = data.reviewSubmit || {
          termsAccepted: false,
          privacyAccepted: false,
          marketingOptIn: false,
          submissionNotes: '',
        };
        const errors: Record<string, string> = {};
        
        if (!reviewData.termsAccepted) {
          errors.termsAccepted = 'Debes aceptar los términos y condiciones';
        }
        if (!reviewData.privacyAccepted) {
          errors.privacyAccepted = 'Debes aceptar la política de privacidad';
        }
        
        return {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      },
    },
  ];

  const handleRegistrationComplete = useCallback(async (registrationData: CompleteRestaurantRegistration) => {
    setError('');
    setIsLoading(true);
    
    try {
      // Use retry mechanism for registration
      await retryWithBackoff(async () => {
        // Convert the multi-step data to the legacy format for the existing registration function
        const legacyData = convertToLegacyFormat(registrationData);
        
        const result = await registerRestaurantClient(supabase, {
          owner_name: legacyData.owner_name,
          email: legacyData.email,
          phone: legacyData.phone,
          password: legacyData.password,
          restaurant_name: legacyData.restaurant_name,
          address: legacyData.address.address,
          location_lat: legacyData.address.location_lat || 0,
          location_lon: legacyData.address.location_lon || 0,
          location_place_id: legacyData.address.location_place_id,
          address_structured: legacyData.address.address_structured,
        });

        if (!result.ok) {
          throw new Error(result.error || 'Error al registrar el restaurante');
        }

        setSubmittedEmail(legacyData.email);
        setIsSubmitted(true);
      }, {
        maxRetries: 3,
        baseDelay: 1000
      });

    } catch (error: unknown) {
      const errorResult = handleError(error as Error, 'restaurant-registration');
      setError(errorResult.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (address: string, placeData?: any) => {
    console.log('📍 Address changed:', { address, placeData });
    console.log('📍 Coordinates in placeData:', placeData?.coordinates);
    
    setFormData(prev => ({ 
      ...prev, 
      address,
      addressPlaceData: placeData 
    }));
    
    // If we have coordinates from place details, set them and show map for confirmation
    if (placeData?.coordinates) {
      const newLat = placeData.coordinates.lat;
      const newLng = placeData.coordinates.lng;
      
      console.log('✅ Setting coordinates:', { lat: newLat, lng: newLng });
      
      setFormData(prev => ({
        ...prev,
        lat: newLat,
        lon: newLng
      }));
      
      // Always show map for confirmation (like mobile app)
      console.log('🗺️ Opening map with coordinates:', { lat: newLat, lng: newLng });
      setShowLocationMap(true);
    } 
    // If we have place data but no coordinates, show map for confirmation (like mobile app)
    else if (placeData && placeData.placeId) {
      console.log('🗺️ Showing map for location confirmation (no coordinates yet)');
      setShowLocationMap(true);
    }
  };

  const handleLocationConfirm = (lat: number, lng: number, confirmedAddress: string) => {
    setFormData(prev => ({
      ...prev,
      lat,
      lon: lng,
      address: confirmedAddress
    }));
    setShowLocationMap(false);
  };

  const handleLocationCancel = () => {
    setShowLocationMap(false);
  };

  const isFormValid = () => {
    const basicFieldsValid = formData.restaurantName.trim() && 
                            formData.phone.trim() && 
                            formData.address.trim() && 
                            formData.ownerName?.trim() && 
                            formData.email.trim() && 
                            formData.password.trim() &&
                            formData.confirmPassword?.trim() &&
                            formData.password === formData.confirmPassword &&
                            formData.password.length >= 6 &&
                            formData.lat !== null &&
                            formData.lon !== null; // Coordinates required like mobile app
    
    const validationsValid = emailValidation !== 'invalid' && 
                           restaurantNameValidation !== 'invalid';
    
    return basicFieldsValid && validationsValid && termsAccepted;
  };

  const handleStartRegistration = async () => {
    if (!isFormValid()) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Follow exact mobile app flow: PASO 1 + PASO 2
      const result = await registerRestaurantAtomic(supabase, {
        restaurantName: formData.restaurantName,
        ownerName: formData.ownerName!,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        lat: formData.lat!,
        lon: formData.lon!,
        placeId: formData.addressPlaceData?.placeId,
        addressStructured: formData.addressPlaceData
      });

      if (result.success) {
        setSubmittedEmail(formData.email);
        setIsSubmitted(true);
        console.log('✅ Registro exitoso:', {
          userId: result.userId,
          restaurantId: result.restaurantId,
          accountId: result.accountId
        });
      } else {
        setError(result.error || 'Error al registrar el restaurante');
      }

    } catch (error: unknown) {
      console.error('💥 Error en registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex min-h-screen">
        {/* Left side - Hero content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmY2YjM1O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjk1MDA7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIgLz4KPC9zdmc+')"
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-12 text-white h-full flex flex-col justify-center">
            {/* Breadcrumb */}
            <div className="mb-8">
              <nav className="flex items-center space-x-2 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">Partners Rappi</span>
                <span className="text-white text-opacity-70">&gt;</span>
                <span className="text-white text-opacity-70">Restaurants</span>
              </nav>
            </div>

            {/* Main content */}
            <div className="max-w-lg">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                0% TARIFAS POR 30 DÍAS
              </h1>
              
              <p className="text-lg mb-6 text-white text-opacity-90">
                Aplica un 30% de descuento en tu menú y <strong>no pagues por el uso de la plataforma</strong> en tus primeros 30 días.
              </p>

              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Únete a Rappi y accede a miles de usuarios cerca de ti
              </h2>

              <p className="text-sm mb-6 text-white text-opacity-80">
                ¡Es por tiempo limitado!
              </p>

              <div className="border-t border-white border-opacity-30 pt-4">
                <p className="text-sm text-white text-opacity-80 underline">
                  ¿Ya eres aliado y quieres registrar otras marcas o sucursales?
                </p>
                <p className="text-sm text-white text-opacity-80 underline">
                  Haz clic aquí &gt;&gt;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="w-full max-w-md bg-white p-8 shadow-xl">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-green-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">¡Gracias por unirte!</h3>
              <p className="text-gray-600 mb-2">
                Hemos enviado un correo a <strong className="text-gray-800">{submittedEmail}</strong>.
              </p>
              <p className="text-gray-600 text-sm">
                Por favor, revisa tu bandeja de entrada para confirmar tu cuenta y completar el registro.
              </p>
            </div>
          ) : showMultiStep ? (
            <div className="w-full">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Registro de Restaurante
              </h3>
              {error && (
                <Alert variant="error" className="mb-6">
                  {error}
                </Alert>
              )}
              <TimeoutHandler
                isLoading={isLoading}
                timeout={60000}
                onTimeout={() => {
                  setError('La operación tardó demasiado tiempo. Inténtalo de nuevo.');
                  setIsLoading(false);
                }}
              >
                <LazyRegistrationComponents.StepperForm
                  steps={registrationSteps}
                  initialData={createEmptyRegistration()}
                  onComplete={handleRegistrationComplete}
                  persistKey="restaurant-registration"
                />
              </TimeoutHandler>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registra tu restaurante
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                ¿Ya comenzaste tu registro? <span className="text-green-600 underline cursor-pointer">continúa aquí.</span>
              </p>

              <form className="space-y-6">
                {/* Restaurant Information Section */}
                <div className="space-y-4">
                  {/* Restaurant name with validation */}
                  <div className="relative">
                    <div className={`flex items-center space-x-3 px-4 py-3 border rounded-lg focus-within:ring-2 transition-all ${
                      restaurantNameValidation === 'invalid' 
                        ? 'border-red-300 bg-red-50 focus-within:ring-red-200' 
                        : restaurantNameValidation === 'valid' 
                        ? 'border-green-300 bg-green-50 focus-within:ring-green-200' 
                        : 'border-gray-300 focus-within:ring-[#e4007c] focus-within:border-[#e4007c]'
                    }`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Nombre del restaurante"
                        value={formData.restaurantName}
                        onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                      />
                      {restaurantNameValidation === 'checking' && (
                        <div className="w-5 h-5 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {restaurantNameValidation === 'valid' && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {restaurantNameValidation === 'invalid' && (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 px-1">
                      <p className="text-xs text-gray-500">Ingresa el nombre del restaurante</p>
                      {restaurantNameValidation === 'invalid' && (
                        <p className="text-xs text-red-600">Este nombre ya está en uso</p>
                      )}
                      {restaurantNameValidation === 'valid' && (
                        <p className="text-xs text-green-600">Nombre disponible</p>
                      )}
                    </div>
                  </div>

                  {/* Phone number */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#e4007c] focus-within:border-[#e4007c] transition-all">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">Ingresa el teléfono</p>
                  </div>

                  {/* Restaurant address with Google Places */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#e4007c] focus-within:border-[#e4007c] transition-all">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <AddressAutocompleteFixed
                        value={formData.address}
                        onChange={handleAddressChange}
                        placeholder="Dirección del restaurante"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">Busca y confirma tu dirección</p>
                    {formData.lat && formData.lon && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs text-green-700 font-medium">Ubicación confirmada</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Coordenadas: {formData.lat.toFixed(6)}, {formData.lon.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsible Person Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    Información del responsable
                  </h3>

                  {/* Full name */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#e4007c] focus-within:border-[#e4007c] transition-all">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={formData.ownerName || ''}
                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Email with validation */}
                  <div className="relative">
                    <div className={`flex items-center space-x-3 px-4 py-3 border rounded-lg focus-within:ring-2 transition-all ${
                      emailValidation === 'invalid' 
                        ? 'border-red-300 bg-red-50 focus-within:ring-red-200' 
                        : emailValidation === 'valid' 
                        ? 'border-green-300 bg-green-50 focus-within:ring-green-200' 
                        : 'border-gray-300 focus-within:ring-[#e4007c] focus-within:border-[#e4007c]'
                    }`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                      />
                      {emailValidation === 'checking' && (
                        <div className="w-5 h-5 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {emailValidation === 'valid' && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {emailValidation === 'invalid' && (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 px-1">
                      <p className="text-xs text-gray-500">Ingresa tu correo</p>
                      {emailValidation === 'invalid' && (
                        <p className="text-xs text-red-600">Este correo ya está registrado</p>
                      )}
                      {emailValidation === 'valid' && (
                        <p className="text-xs text-green-600">Correo disponible</p>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#e4007c] focus-within:border-[#e4007c] transition-all">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                      />
                      <svg className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <div className={`flex items-center space-x-3 px-4 py-3 border rounded-lg focus-within:ring-2 transition-all ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-300 bg-red-50 focus-within:ring-red-200' 
                        : formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6
                        ? 'border-green-300 bg-green-50 focus-within:ring-green-200' 
                        : 'border-gray-300 focus-within:ring-[#e4007c] focus-within:border-[#e4007c]'
                    }`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={formData.confirmPassword || ''}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                      />
                      {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1 px-1">Las contraseñas no coinciden</p>
                    )}
                  </div>
                </div>

                {/* Email confirmation notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Te enviaremos un email de confirmación</p>
                      <p className="text-xs text-blue-600 mt-1">Nuestro equipo revisará tu solicitud en 24-48 horas</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      Acepto los{' '}
                      <a 
                        href="/legal/terminos-restaurantes" 
                        target="_blank"
                        className="text-[#e4007c] hover:text-[#c6006b] underline font-medium"
                      >
                        Términos y Condiciones para Restaurantes
                      </a>
                      {' '}y la{' '}
                      <a 
                        href="/legal/privacidad-restaurantes" 
                        target="_blank"
                        className="text-[#e4007c] hover:text-[#c6006b] underline font-medium"
                      >
                        Política de Privacidad
                      </a>
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleStartRegistration}
                  disabled={!isFormValid() || isLoading}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                    isFormValid() && !isLoading
                      ? 'bg-gradient-to-r from-[#e4007c] to-pink-500 hover:from-[#c6006b] hover:to-pink-600 text-white hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Registrando restaurante...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Registrar restaurante</span>
                    </div>
                  )}
                </button>

                {/* Alternative option */}
                <div className="text-center pt-4">
                  <p className="text-[#e4007c] text-sm cursor-pointer hover:text-[#c6006b]">
                    Mi negocio no es un restaurante
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Location Confirmation Map */}
      <LocationConfirmationMapSmart
        address={formData.address}
        initialLat={formData.addressPlaceData?.coordinates?.lat || formData.lat || undefined}
        initialLng={formData.addressPlaceData?.coordinates?.lng || formData.lon || undefined}
        onLocationConfirm={handleLocationConfirm}
        onCancel={handleLocationCancel}
        isOpen={showLocationMap}
      />
    </div>
  );
}
