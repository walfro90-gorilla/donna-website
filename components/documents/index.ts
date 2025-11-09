// components/documents/index.ts
export { default as DocumentUploader } from './DocumentUploader';
export type { 
  DocumentRequirement, 
  DocumentValidationRule, 
  UploadedDocument, 
  DocumentUploaderProps,
  DocumentMetadata,
  UploadResult 
} from './DocumentUploader';

export { default as DocumentPreview } from './DocumentPreview';
export type { DocumentPreviewProps } from './DocumentPreview';

export { default as DocumentValidator, MEXICAN_BUSINESS_RULES, GENERAL_FILE_RULES } from './DocumentValidator';
export type { 
  ValidationRule, 
  ValidationResult, 
  DocumentValidatorProps,
  ValidationRuleResult 
} from './DocumentValidator';