// components/registration/index.ts

export { default as BusinessInformationStep } from './BusinessInformationStep';
export type { BusinessInformation, BusinessInformationStepProps } from './BusinessInformationStep';

export { default as LocationAddressStep } from './LocationAddressStep';
export type { LocationAddress, LocationAddressStepProps } from './LocationAddressStep';

export { default as LegalDocumentationStep } from './LegalDocumentationStep';
export type { 
  LegalDocumentation, 
  LegalDocument, 
  DocumentType, 
  LegalDocumentationStepProps 
} from './LegalDocumentationStep';

export { default as BrandingMediaStep } from './BrandingMediaStep';
export type { BrandingMedia, BrandingMediaStepProps } from './BrandingMediaStep';

export { default as MenuCreationStep } from './MenuCreationStep';
export type { MenuCreation, MenuCreationStepProps } from './MenuCreationStep';

export { default as ReviewSubmitStep } from './ReviewSubmitStep';
export type { ReviewSubmitData, ReviewSubmitStepProps } from './ReviewSubmitStep';