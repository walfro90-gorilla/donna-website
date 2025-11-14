// types/registration.ts

import type { Address } from './address';
import type { 
  BusinessInformation,
  LocationAddress,
  LegalDocumentation,
  BrandingMedia,
  MenuCreation
} from '@/components/registration';

export interface CompleteRestaurantRegistration {
  // Step 1: Business Information
  businessInfo: BusinessInformation;
  
  // Step 2: Location & Address
  locationAddress: LocationAddress;
  
  // Step 3: Legal Documentation
  legalDocumentation: LegalDocumentation;
  
  // Step 4: Branding & Media
  brandingMedia: BrandingMedia;
  
  // Step 5: Menu Creation
  menuCreation: MenuCreation;
  
  // Step 6: Review & Submit
  reviewSubmit?: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    marketingOptIn: boolean;
    submissionNotes?: string;
  };
  
  // Additional metadata
  registrationId?: string;
  currentStep?: number;
  completedSteps?: string[];
  startedAt?: string;
  lastUpdatedAt?: string;
}

export interface RegistrationStepData {
  [key: string]: any;
}

export interface RegistrationProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<string>;
  completionPercentage: number;
  canProceed: boolean;
  errors?: Record<string, string>;
}

// Legacy interface for backward compatibility
export interface RestaurantFormData {
  owner_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  restaurant_name: string;
}

// Conversion utilities
export function convertToLegacyFormat(
  registration: CompleteRestaurantRegistration
): RestaurantFormData & { address: Address } {
  return {
    owner_name: registration.businessInfo.ownerName || registration.businessInfo.businessName || '',
    email: registration.businessInfo.email || '',
    phone: registration.businessInfo.phone || '',
    password: registration.businessInfo.password || '',
    confirm_password: '',
    restaurant_name: registration.businessInfo.businessName || '',
    address: {
      address: registration.locationAddress.formattedAddress || 
               `${registration.locationAddress.street} ${registration.locationAddress.number}, ${registration.locationAddress.city}`,
      location_lat: registration.locationAddress.coordinates?.lat || null,
      location_lon: registration.locationAddress.coordinates?.lng || null,
      location_place_id: registration.locationAddress.placeId || null,
      address_structured: {}, // Empty object instead of null
    }
  };
}

export function createEmptyRegistration(): CompleteRestaurantRegistration {
  return {
    businessInfo: {
      ownerName: '',
      businessName: '',
      businessType: 'restaurant',
      cuisine: [],
      description: '',
      phone: '',
      email: '',
      password: '',
      operatingHours: {},
    },
    locationAddress: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México',
      addressType: 'commercial',
      hasParking: false,
      hasDeliveryAccess: true,
      isVisible: true,
    },
    legalDocumentation: {
      documents: [],
      businessLegalName: '',
      taxId: '',
      legalRepresentative: {
        name: '',
        position: '',
        idNumber: '',
        phone: '',
        email: '',
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
    },
    brandingMedia: {
      galleryImages: [],
      brandColors: {
        primary: '#e4007c',
        secondary: '#00d4aa',
      },
      socialMediaHandles: {},
      promotionalImages: [],
      menuImages: [],
    },
    menuCreation: {
      categories: [],
      menuItems: [],
      isMenuComplete: false,
      menuPreviewMode: false,
    },
  };
}