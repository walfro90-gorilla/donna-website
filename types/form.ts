// types/form.ts
export type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export type FieldType = 'email' | 'phone' | 'name' | 'password';

export type UserType = 'restaurant' | 'repartidor' | 'cliente';

export interface FormState {
  [key: string]: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface RestaurantFormData {
  owner_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  restaurant_name: string;
}

export interface ClientFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface DeliveryDriverFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

// Enhanced delivery driver registration types
export interface DeliveryDriverPersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  nationalId: string;
  termsAccepted?: boolean;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface DeliveryDriverVehicleInfo {
  vehicleType: 'bicycle' | 'motorcycle' | 'car' | 'scooter';
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  licensePlate: string;
  hasInsurance: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  vehicleRegistrationNumber: string;
}

export interface DeliveryDriverDocumentation {
  documents: DriverDocument[];
  hasDriverLicense: boolean;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  hasVehicleRegistration: boolean;
  hasInsuranceProof: boolean;
  hasIdentityDocument: boolean;
}

export interface DriverDocument {
  id: string;
  type: DriverDocumentType;
  filename: string;
  url: string;
  status: DocumentStatus;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export type DriverDocumentType = 
  | 'driver_license_front'
  | 'driver_license_back'
  | 'vehicle_registration'
  | 'insurance_proof'
  | 'identity_document_front'
  | 'identity_document_back'
  | 'vehicle_photo'
  | 'profile_photo';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface DeliveryDriverBackgroundCheck {
  consentGiven: boolean;
  backgroundCheckStatus: BackgroundCheckStatus;
  backgroundCheckId?: string;
  estimatedCompletionDate?: string;
  completedAt?: string;
  results?: BackgroundCheckResults;
}

export type BackgroundCheckStatus = 
  | 'not_started'
  | 'consent_pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface BackgroundCheckResults {
  criminalRecord: 'clear' | 'pending_review' | 'disqualified';
  drivingRecord: 'clear' | 'pending_review' | 'disqualified';
  identityVerification: 'verified' | 'pending' | 'failed';
  overallStatus: 'approved' | 'rejected' | 'pending_review';
  notes?: string;
}

export interface CompleteDeliveryDriverRegistration {
  personalInfo: DeliveryDriverPersonalInfo;
  vehicleInfo: DeliveryDriverVehicleInfo;
  documentation: DeliveryDriverDocumentation;
  backgroundCheck: DeliveryDriverBackgroundCheck;
  
  // Additional metadata
  registrationId?: string;
  currentStep?: number;
  completedSteps?: string[];
  startedAt?: string;
  lastUpdatedAt?: string;
  applicationStatus?: DriverApplicationStatus;
}

export type DriverApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'documents_pending'
  | 'background_check_pending'
  | 'approved'
  | 'rejected'
  | 'on_hold';

export interface DriverApplicationStatusInfo {
  status: DriverApplicationStatus;
  statusMessage: string;
  nextSteps: string[];
  estimatedTimeToApproval?: string;
  documentsNeeded?: DriverDocumentType[];
  rejectionReasons?: string[];
  canResubmit?: boolean;
  lastUpdated: string;
}

