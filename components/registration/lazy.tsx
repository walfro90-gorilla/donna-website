// components/registration/lazy.tsx
"use client";

import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui';
import { createLazyComponent } from '@/lib/utils/performance';

// Loading fallback component
const RegistrationStepSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
    <div className="flex justify-between">
      <div className="h-10 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

// Lazy load restaurant registration components
export const LazyBusinessInformationStep = createLazyComponent(
  () => import('./BusinessInformationStep')
);

export const LazyLocationAddressStep = createLazyComponent(
  () => import('./LocationAddressStep')
);

export const LazyLegalDocumentationStep = createLazyComponent(
  () => import('./LegalDocumentationStep')
);

export const LazyBrandingMediaStep = createLazyComponent(
  () => import('./BrandingMediaStep')
);

export const LazyMenuCreationStep = createLazyComponent(
  () => import('./MenuCreationStep')
);

export const LazyReviewSubmitStep = createLazyComponent(
  () => import('./ReviewSubmitStep')
);

// Lazy load customer registration components
export const LazyCustomerPersonalInformationStep = createLazyComponent(
  () => import('./customer/PersonalInformationStep')
);

export const LazyAddressSetupStep = createLazyComponent(
  () => import('./customer/AddressSetupStep')
);

export const LazyAccountSecurityStep = createLazyComponent(
  () => import('./customer/AccountSecurityStep')
);

export const LazyRestaurantDiscoveryStep = createLazyComponent(
  () => import('./customer/RestaurantDiscoveryStep')
);

// Lazy load driver registration components
export const LazyDriverPersonalInformationStep = createLazyComponent(
  () => import('./driver/PersonalInformationStep')
);

export const LazyVehicleInformationStep = createLazyComponent(
  () => import('./driver/VehicleInformationStep')
);

export const LazyDocumentationStep = createLazyComponent(
  () => import('./driver/DocumentationStep')
);

export const LazyBackgroundCheckStep = createLazyComponent(
  () => import('./driver/BackgroundCheckStep')
);

// Lazy load heavy form components
export const LazyStepperForm = createLazyComponent(
  () => import('../forms/StepperForm')
);

// Lazy load document management components
export const LazyDocumentUploader = createLazyComponent(
  () => import('../documents/DocumentUploader')
);

export const LazyDocumentPreview = createLazyComponent(
  () => import('../documents/DocumentPreview')
);

// Lazy load menu components
export const LazyMenuItemEditor = createLazyComponent(
  () => import('../menu/MenuItemEditor')
);

export const LazyCategoryManager = createLazyComponent(
  () => import('../menu/CategoryManager')
);

export const LazyImageUploader = createLazyComponent(
  () => import('../menu/ImageUploader')
);

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<P extends object>(
  LazyComponent: ComponentType<P>,
  fallback?: ComponentType,
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
) {
  const WrappedComponent = (props: P) => {
    const FallbackComponent = fallback || RegistrationStepSkeleton;
    const ErrorFallback = errorFallback || (({ error, retry }) => (
      <div className="text-center py-8 space-y-4">
        <div className="text-red-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Error al cargar el componente</h3>
        <p className="text-gray-600">Hubo un problema al cargar esta sección.</p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-[#e4007c] text-white rounded-lg hover:bg-[#c6006b] transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    ));

    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  WrappedComponent.displayName = `withLazyLoading(${LazyComponent.displayName || LazyComponent.name})`;
  return WrappedComponent;
}

// Preload functions for critical components
export const preloadCriticalComponents = () => {
  // Preload the most commonly used components
  import('./BusinessInformationStep');
  import('../forms/StepperForm');
  import('./customer/PersonalInformationStep');
};

// Preload components based on user type
export const preloadUserTypeComponents = (userType: 'restaurant' | 'customer' | 'driver') => {
  switch (userType) {
    case 'restaurant':
      import('./BusinessInformationStep');
      import('./LocationAddressStep');
      import('./LegalDocumentationStep');
      import('./BrandingMediaStep');
      import('./MenuCreationStep');
      break;
    case 'customer':
      import('./customer/PersonalInformationStep');
      import('./customer/AddressSetupStep');
      import('./customer/AccountSecurityStep');
      break;
    case 'driver':
      import('./driver/PersonalInformationStep');
      import('./driver/VehicleInformationStep');
      import('./driver/DocumentationStep');
      import('./driver/BackgroundCheckStep');
      break;
  }
};

// Export wrapped components with lazy loading
export const LazyRegistrationComponents = {
  // Restaurant components
  BusinessInformationStep: withLazyLoading(LazyBusinessInformationStep),
  LocationAddressStep: withLazyLoading(LazyLocationAddressStep),
  LegalDocumentationStep: withLazyLoading(LazyLegalDocumentationStep),
  BrandingMediaStep: withLazyLoading(LazyBrandingMediaStep),
  MenuCreationStep: withLazyLoading(LazyMenuCreationStep),
  ReviewSubmitStep: withLazyLoading(LazyReviewSubmitStep),
  
  // Customer components
  CustomerPersonalInformationStep: withLazyLoading(LazyCustomerPersonalInformationStep),
  AddressSetupStep: withLazyLoading(LazyAddressSetupStep),
  AccountSecurityStep: withLazyLoading(LazyAccountSecurityStep),
  RestaurantDiscoveryStep: withLazyLoading(LazyRestaurantDiscoveryStep),
  
  // Driver components
  DriverPersonalInformationStep: withLazyLoading(LazyDriverPersonalInformationStep),
  VehicleInformationStep: withLazyLoading(LazyVehicleInformationStep),
  DocumentationStep: withLazyLoading(LazyDocumentationStep),
  BackgroundCheckStep: withLazyLoading(LazyBackgroundCheckStep),
  
  // Form components
  StepperForm: withLazyLoading(LazyStepperForm),
  
  // Document components
  DocumentUploader: withLazyLoading(LazyDocumentUploader),
  DocumentPreview: withLazyLoading(LazyDocumentPreview),
  
  // Menu components
  MenuItemEditor: withLazyLoading(LazyMenuItemEditor),
  CategoryManager: withLazyLoading(LazyCategoryManager),
  ImageUploader: withLazyLoading(LazyImageUploader)
};