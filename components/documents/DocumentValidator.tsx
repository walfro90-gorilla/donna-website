// components/documents/DocumentValidator.tsx
"use client";

import { useState, useEffect } from 'react';
import { Alert, Badge } from '@/components/ui';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'required' | 'format' | 'size' | 'content' | 'mexican_business';
  validator: (file: File, metadata?: any) => Promise<ValidationResult> | ValidationResult;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: string;
  suggestions?: string[];
}

export interface DocumentValidatorProps {
  file: File;
  rules: ValidationRule[];
  onValidationComplete?: (results: ValidationRuleResult[]) => void;
  showDetails?: boolean;
  className?: string;
}

export interface ValidationRuleResult extends ValidationResult {
  rule: ValidationRule;
}

// Mexican business document validation rules
export const MEXICAN_BUSINESS_RULES: ValidationRule[] = [
  {
    id: 'rfc-format',
    name: 'Formato RFC',
    description: 'Verifica que el RFC tenga el formato correcto',
    type: 'mexican_business',
    severity: 'error',
    validator: (file: File) => {
      // This would typically involve OCR or manual verification
      // For demo purposes, we'll check filename patterns
      const filename = file.name.toLowerCase();
      const hasRFC = filename.includes('rfc') || filename.includes('registro');
      
      return {
        isValid: hasRFC,
        message: hasRFC ? 'Formato RFC detectado' : 'No se detectó formato RFC válido',
        suggestions: hasRFC ? [] : [
          'Asegúrate de que el documento contenga el RFC completo',
          'El RFC debe tener 12 o 13 caracteres',
          'Verifica que sea legible y sin alteraciones'
        ]
      };
    }
  },
  {
    id: 'bank-certificate',
    name: 'Certificado Bancario',
    description: 'Valida que sea un certificado bancario oficial',
    type: 'mexican_business',
    severity: 'error',
    validator: (file: File) => {
      const filename = file.name.toLowerCase();
      const isBankDoc = filename.includes('bancario') || 
                       filename.includes('certificado') || 
                       filename.includes('banco');
      
      return {
        isValid: isBankDoc,
        message: isBankDoc ? 'Certificado bancario detectado' : 'No se detectó certificado bancario',
        suggestions: isBankDoc ? [] : [
          'El documento debe ser emitido por una institución bancaria',
          'Debe contener el nombre completo del titular',
          'Debe incluir el número de cuenta (puede estar censurado parcialmente)',
          'Debe tener fecha de emisión reciente (máximo 3 meses)'
        ]
      };
    }
  },
  {
    id: 'identification-document',
    name: 'Documento de Identidad',
    description: 'Verifica que sea una identificación oficial válida',
    type: 'mexican_business',
    severity: 'error',
    validator: (file: File) => {
      const filename = file.name.toLowerCase();
      const isID = filename.includes('ine') || 
                   filename.includes('identificacion') || 
                   filename.includes('cedula') ||
                   filename.includes('pasaporte');
      
      return {
        isValid: isID,
        message: isID ? 'Documento de identidad detectado' : 'No se detectó documento de identidad válido',
        suggestions: isID ? [] : [
          'Acepta INE, cédula profesional o pasaporte vigente',
          'El documento debe estar vigente',
          'Debe ser legible en ambos lados',
          'No debe estar alterado o dañado'
        ]
      };
    }
  },
  {
    id: 'acta-constitutiva',
    name: 'Acta Constitutiva',
    description: 'Valida el acta constitutiva para personas morales',
    type: 'mexican_business',
    severity: 'warning',
    validator: (file: File) => {
      const filename = file.name.toLowerCase();
      const isActa = filename.includes('acta') || 
                     filename.includes('constitutiva') || 
                     filename.includes('constitucion');
      
      return {
        isValid: isActa,
        message: isActa ? 'Acta constitutiva detectada' : 'Acta constitutiva no detectada',
        details: 'Solo requerida para personas morales',
        suggestions: isActa ? [] : [
          'Requerida solo si eres persona moral',
          'Debe estar certificada por notario público',
          'Debe incluir el objeto social de la empresa',
          'Verifica que esté vigente y sin modificaciones pendientes'
        ]
      };
    }
  }
];

// General file validation rules
export const GENERAL_FILE_RULES: ValidationRule[] = [
  {
    id: 'file-size',
    name: 'Tamaño de Archivo',
    description: 'Verifica que el archivo no exceda el límite permitido',
    type: 'size',
    severity: 'error',
    validator: (file: File) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const isValid = file.size <= maxSize;
      
      return {
        isValid,
        message: isValid 
          ? `Tamaño válido: ${formatFileSize(file.size)}` 
          : `Archivo demasiado grande: ${formatFileSize(file.size)}`,
        suggestions: isValid ? [] : [
          `Reduce el tamaño del archivo a menos de ${formatFileSize(maxSize)}`,
          'Comprime la imagen si es necesario',
          'Usa un formato más eficiente como PDF para documentos'
        ]
      };
    }
  },
  {
    id: 'file-format',
    name: 'Formato de Archivo',
    description: 'Verifica que el formato sea compatible',
    type: 'format',
    severity: 'error',
    validator: (file: File) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const isValid = allowedTypes.includes(file.type);
      
      return {
        isValid,
        message: isValid 
          ? `Formato válido: ${file.type}` 
          : `Formato no válido: ${file.type}`,
        suggestions: isValid ? [] : [
          'Usa formatos PDF, JPG o PNG',
          'Convierte el archivo al formato correcto',
          'Asegúrate de que el archivo no esté corrupto'
        ]
      };
    }
  },
  {
    id: 'image-quality',
    name: 'Calidad de Imagen',
    description: 'Verifica que la imagen tenga suficiente resolución',
    type: 'content',
    severity: 'warning',
    validator: (file: File) => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
          resolve({
            isValid: true,
            message: 'No es una imagen, validación omitida'
          });
          return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
          URL.revokeObjectURL(url);
          const minWidth = 800;
          const minHeight = 600;
          const isValid = img.width >= minWidth && img.height >= minHeight;
          
          resolve({
            isValid,
            message: isValid 
              ? `Resolución adecuada: ${img.width}x${img.height}` 
              : `Resolución baja: ${img.width}x${img.height}`,
            suggestions: isValid ? [] : [
              `Usa una imagen de al menos ${minWidth}x${minHeight} píxeles`,
              'Toma una foto con mejor calidad',
              'Asegúrate de que el texto sea legible'
            ]
          });
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            isValid: false,
            message: 'No se pudo cargar la imagen',
            suggestions: [
              'Verifica que el archivo no esté corrupto',
              'Intenta con otro formato de imagen'
            ]
          });
        };
        
        img.src = url;
      });
    }
  }
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DocumentValidator({
  file,
  rules,
  onValidationComplete,
  showDetails = true,
  className = '',
}: DocumentValidatorProps) {
  const [validationResults, setValidationResults] = useState<ValidationRuleResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    validateFile();
  }, [file, rules]);

  const validateFile = async () => {
    setIsValidating(true);
    const results: ValidationRuleResult[] = [];

    for (const rule of rules) {
      try {
        const result = await rule.validator(file);
        results.push({
          ...result,
          rule
        });
      } catch (error) {
        results.push({
          isValid: false,
          message: `Error en validación: ${rule.name}`,
          details: error instanceof Error ? error.message : 'Error desconocido',
          rule
        });
      }
    }

    setValidationResults(results);
    setIsValidating(false);
    
    if (onValidationComplete) {
      onValidationComplete(results);
    }
  };

  const getOverallStatus = () => {
    if (isValidating) return 'validating';
    
    const hasErrors = validationResults.some(r => !r.isValid && r.rule.severity === 'error');
    const hasWarnings = validationResults.some(r => !r.isValid && r.rule.severity === 'warning');
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validating':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'validating':
        return 'Validando documento...';
      case 'success':
        return 'Documento válido';
      case 'warning':
        return 'Documento válido con advertencias';
      case 'error':
        return 'Documento no válido';
      default:
        return 'Estado desconocido';
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Status */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        {getStatusIcon(overallStatus)}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Validación de Documento
          </h3>
          <p className="text-xs text-gray-600">
            {getStatusMessage(overallStatus)}
          </p>
        </div>
        <Badge 
          variant={
            overallStatus === 'success' ? 'success' : 
            overallStatus === 'warning' ? 'warning' : 
            overallStatus === 'error' ? 'error' : 'default'
          }
        >
          {overallStatus === 'validating' ? 'Validando' : 
           overallStatus === 'success' ? 'Válido' :
           overallStatus === 'warning' ? 'Advertencias' : 'Errores'}
        </Badge>
      </div>

      {/* Validation Results */}
      {showDetails && validationResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Resultados de Validación
          </h4>
          
          {validationResults.map((result, index) => (
            <div
              key={result.rule.id}
              className={`
                p-3 rounded-lg border
                ${result.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : result.rule.severity === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {result.isValid ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : result.rule.severity === 'error' ? (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h5 className="text-sm font-medium text-gray-900">
                      {result.rule.name}
                    </h5>
                    <Badge 
                      variant={result.rule.severity === 'error' ? 'error' : result.rule.severity === 'warning' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {result.rule.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-1">
                    {result.message}
                  </p>
                  
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1">
                      {result.details}
                    </p>
                  )}
                  
                  {result.suggestions && result.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Sugerencias:
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start space-x-1">
                            <span className="text-gray-400">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Alert */}
      {!isValidating && (
        <Alert
          variant={
            overallStatus === 'success' ? 'success' :
            overallStatus === 'warning' ? 'warning' : 'error'
          }
        >
          {overallStatus === 'success' && 'El documento ha pasado todas las validaciones requeridas.'}
          {overallStatus === 'warning' && 'El documento es válido pero tiene algunas advertencias que deberías revisar.'}
          {overallStatus === 'error' && 'El documento no cumple con los requisitos. Por favor, corrige los errores antes de continuar.'}
        </Alert>
      )}
    </div>
  );
}