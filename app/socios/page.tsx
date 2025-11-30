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
import { CountryCodeSelector } from '@/components/ui/CountryCodeSelector';

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
  const [lada, setLada] = useState('+52');

  const supabase = useSupabase();

  // Construct full phone for validation
  const fullPhone = lada + formData.phone;

  // Field validations
  const emailValidation = useRestaurantValidation('email', formData.email);
  const restaurantNameValidation = useRestaurantValidation('restaurantName', formData.restaurantName);
  const phoneValidation = useRestaurantValidation('phone', fullPhone);

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
      restaurantNameValidation !== 'invalid' &&
      phoneValidation !== 'invalid';

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
        phone: fullPhone, // Send full phone with LADA
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Main Content */}
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left side - Hero content */}
        <div className="flex-1 relative overflow-hidden min-h-[40vh] lg:min-h-screen">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80')"
            }}
          >
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-16 text-white h-full flex flex-col justify-center lg:justify-start lg:pt-4 animate-fade-in">
            {/* Breadcrumb */}
            <div className="mb-8 hidden lg:block">
              <nav className="flex items-center space-x-2 text-sm font-medium">
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/30 transition-colors cursor-pointer">Partners Doña</span>
                <span className="text-white/60">&gt;</span>
                <span className="text-white/90">Restaurantes</span>
              </nav>
            </div>

            {/* Main content */}
            <div className="max-w-xl space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
                  15% de comisión <br />
                  <span className="text-primary-light text-3xl lg:text-5xl">¡La más baja del mercado!</span>
                </h1>

                <div className="space-y-4">
                  <div className="flex items-center text-lg lg:text-xl text-gray-200">
                    <CheckCircleIcon />
                    <span>Pagos dentro de las 48 hrs en efectivo.</span>
                  </div>
                  <div className="flex items-center text-lg lg:text-xl text-gray-200">
                    <CheckCircleIcon />
                    <span>Repartidores más cercanos.</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                  <div className="p-2 bg-green-500/20 rounded-full">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="font-bold">Más Ventas</p>
                    <p className="text-sm text-gray-300">Llega a nuevos clientes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold">Entrega Rápida</p>
                    <p className="text-sm text-gray-300">Flota de repartidores lista</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-8 mt-8">
                <p className="text-sm text-gray-300 mb-2">
                  ¿Ya eres aliado y quieres registrar otras marcas?
                </p>
                <button className="text-white font-semibold hover:text-primary-light transition-colors flex items-center gap-2 group">
                  Gestionar mis marcas
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="w-full lg:max-w-xl bg-white dark:bg-gray-800 p-6 lg:p-12 shadow-2xl overflow-y-auto relative z-20 lg:-ml-10 lg:my-10 lg:rounded-l-3xl border-l border-gray-100 dark:border-gray-700">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Registra tu restaurante
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-100 mb-6">
                ¿Ya comenzaste tu registro? <span className="text-green-600 dark:text-green-400 underline cursor-pointer">continúa aquí.</span>
              </p>

              <form className="space-y-6">
                {/* Restaurant Information Section */}
                <div className="space-y-4">
                  {/* Restaurant name with validation */}
                  <div className="relative">
                    <div className={`flex items-center space-x-3 px-4 py-3 border rounded-lg focus-within:ring-2 transition-all ${restaurantNameValidation === 'invalid'
                      ? 'border-red-300 bg-red-50 focus-within:ring-red-200'
                      : restaurantNameValidation === 'valid'
                        ? 'border-green-300 bg-green-50 focus-within:ring-green-200'
                        : 'border-gray-300 focus-within:ring-[#e4007c] focus-within:border-[#e4007c]'
                      }`}>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Nombre del restaurante"
                        value={formData.restaurantName}
                        onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ingresa el nombre del restaurante</p>
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
                    <div className={`flex items-center space-x-3 px-4 py-3 border rounded-lg focus-within:ring-2 transition-all ${phoneValidation === 'invalid'
                      ? 'border-red-300 bg-red-50 focus-within:ring-red-200'
                      : phoneValidation === 'valid'
                        ? 'border-green-300 bg-green-50 focus-within:ring-green-200'
                        : 'border-gray-300 dark:border-gray-600 focus-within:ring-[#e4007c] focus-within:border-[#e4007c]'
                      }`}>

                      {/* Lada Selector */}
                      <div className="border-r border-gray-300 dark:border-gray-600">
                        <CountryCodeSelector
                          value={lada}
                          onChange={setLada}
                        />
                      </div>

                      <input
                        type="tel"
                        placeholder="Teléfono"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                        className="flex-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      {phoneValidation === 'checking' && (
                        <div className="w-5 h-5 border-2 border-[#e4007c] border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {phoneValidation === 'valid' && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {phoneValidation === 'invalid' && (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 px-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ingresa el teléfono</p>
                      {phoneValidation === 'invalid' && (
                        <p className="text-xs text-red-600">Este teléfono ya está registrado</p>
                      )}
                      {phoneValidation === 'valid' && (
                        <p className="text-xs text-green-600">Teléfono disponible</p>
                      )}
                    </div>
                  </div>

                  {/* Restaurant address with Google Places */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-[#e4007c] focus-within:border-[#e4007c] transition-all">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <AddressAutocompleteFixed
                        value={formData.address}
                        onChange={handleAddressChange}
                        placeholder="Dirección del restaurante"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">Busca y confirma tu dirección</p>
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
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Información del responsable
                  </h3>

                  {/* Full name */}
                  <div className="relative">
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-[#e4007c] focus-within:border-[#e4007c] transition-all">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={formData.ownerName || ''}
                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Email with validation */}
                  <div className="relative">
                    <div className={`flex items-center space-x-3 px-4 py-3 border rounded-lg focus-within:ring-2 transition-all ${emailValidation === 'invalid'
                      ? 'border-red-300 bg-red-50 focus-within:ring-red-200'
                      : emailValidation === 'valid'
                        ? 'border-green-300 bg-green-50 focus-within:ring-green-200'
                        : 'border-gray-300 focus-within:ring-[#e4007c] focus-within:border-[#e4007c]'
                      }`}>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ingresa tu correo</p>
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
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-[#e4007c] focus-within:border-[#e4007c] transition-all">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <div className={`flex items-center space-x-3 px-4 py-3 border rounded-lg focus-within:ring-2 transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-300 bg-red-50 focus-within:ring-red-200'
                      : formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6
                        ? 'border-green-300 bg-green-50 focus-within:ring-green-200'
                        : 'border-gray-300 focus-within:ring-[#e4007c] focus-within:border-[#e4007c]'
                      }`}>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={formData.confirmPassword || ''}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="flex-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
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
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${isFormValid() && !isLoading
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
