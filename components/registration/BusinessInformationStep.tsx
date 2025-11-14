// components/registration/BusinessInformationStep.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { 
  generateResponsiveFontClasses,
  generateResponsiveSpacingClasses,
  generateFocusRingClasses,
  generateTouchFriendlyClasses,
  ACCESSIBILITY 
} from '@/lib/utils';

export interface BusinessInformation {
  ownerName: string;
  businessName: string;
  businessType: 'restaurant' | 'cafe' | 'bakery' | 'food_truck' | 'catering' | 'other';
  cuisine: string[];
  description: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  operatingHours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
  capacity?: number;
  deliveryRadius?: number;
  minimumOrder?: number;
}

export interface BusinessInformationStepProps {
  data: Partial<BusinessInformation>;
  onDataChange: (data: Partial<BusinessInformation>) => void;
  onNext: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

const BUSINESS_TYPES = [
  { id: 'restaurant', name: 'Restaurante', description: 'Servicio completo de comida' },
  { id: 'cafe', name: 'Café', description: 'Café, bebidas y snacks' },
  { id: 'bakery', name: 'Panadería', description: 'Pan, pasteles y productos horneados' },
  { id: 'food_truck', name: 'Food Truck', description: 'Comida móvil' },
  { id: 'catering', name: 'Catering', description: 'Servicio de eventos' },
  { id: 'other', name: 'Otro', description: 'Otro tipo de negocio de comida' }
];

const CUISINE_TYPES = [
  'Mexicana', 'Italiana', 'China', 'Japonesa', 'Americana', 'Francesa',
  'India', 'Tailandesa', 'Mediterránea', 'Árabe', 'Peruana', 'Argentina',
  'Española', 'Coreana', 'Brasileña', 'Vegetariana', 'Vegana', 'Mariscos',
  'Parrilla', 'Pizza', 'Hamburguesas', 'Tacos', 'Sushi', 'Postres'
];

const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miércoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sábado' },
  { id: 'sunday', name: 'Domingo' }
];

export default function BusinessInformationStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading = false,
  errors = {}
}: BusinessInformationStepProps) {
  const [localData, setLocalData] = useState<Partial<BusinessInformation>>(data);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(data.cuisine || []);
  const [customCuisine, setCustomCuisine] = useState('');

  // Initialize operating hours if not present
  useEffect(() => {
    if (!localData.operatingHours) {
      const defaultHours = DAYS_OF_WEEK.reduce((acc, day) => {
        acc[day.id] = {
          isOpen: true,
          openTime: '09:00',
          closeTime: '22:00'
        };
        return acc;
      }, {} as BusinessInformation['operatingHours']);
      
      setLocalData(prev => ({ ...prev, operatingHours: defaultHours }));
    }
  }, [localData.operatingHours]);

  const handleInputChange = useCallback((field: keyof BusinessInformation, value: any) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  }, [localData, onDataChange]);

  const handleCuisineToggle = useCallback((cuisine: string) => {
    const newCuisines = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter(c => c !== cuisine)
      : [...selectedCuisines, cuisine];
    
    setSelectedCuisines(newCuisines);
    handleInputChange('cuisine', newCuisines);
  }, [selectedCuisines, handleInputChange]);

  const handleAddCustomCuisine = useCallback(() => {
    if (customCuisine.trim() && !selectedCuisines.includes(customCuisine.trim())) {
      const newCuisines = [...selectedCuisines, customCuisine.trim()];
      setSelectedCuisines(newCuisines);
      handleInputChange('cuisine', newCuisines);
      setCustomCuisine('');
    }
  }, [customCuisine, selectedCuisines, handleInputChange]);

  const handleOperatingHoursChange = useCallback((day: string, field: string, value: any) => {
    const updatedHours = {
      ...localData.operatingHours,
      [day]: {
        ...localData.operatingHours?.[day],
        [field]: value
      }
    };
    handleInputChange('operatingHours', updatedHours);
  }, [localData.operatingHours, handleInputChange]);

  const handleSocialMediaChange = useCallback((platform: string, value: string) => {
    const updatedSocialMedia = {
      ...localData.socialMedia,
      [platform]: value
    };
    handleInputChange('socialMedia', updatedSocialMedia);
  }, [localData.socialMedia, handleInputChange]);

  const validateForm = useCallback((): boolean => {
    const requiredFields = ['ownerName', 'businessName', 'businessType', 'phone', 'email', 'password'];
    return requiredFields.every(field => localData[field as keyof BusinessInformation]);
  }, [localData]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      onNext();
    }
  }, [validateForm, onNext]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center">
        <h2 
          className={`${generateResponsiveFontClasses({ base: 'xl', tablet: '2xl' })} font-bold text-gray-900 mb-2`}
          id="business-info-title"
        >
          Información del Negocio
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Cuéntanos sobre tu restaurante para crear tu perfil
        </p>
      </div>

      {/* Basic Information */}
      <Card 
        className={generateResponsiveSpacingClasses('p', { base: '4', tablet: '6' })}
        role="region"
        ariaLabelledBy="basic-info-heading"
      >
        <h3 
          className="text-lg font-semibold text-gray-900 mb-4"
          id="basic-info-heading"
        >
          Información Básica
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Propietario
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              <span className="sr-only">{ACCESSIBILITY.ariaLabels.required}</span>
            </label>
            <input
              type="text"
              id="ownerName"
              value={localData.ownerName || ''}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm transition-all duration-200
                ${generateTouchFriendlyClasses('md')} ${generateFocusRingClasses()}
                ${errors.ownerName ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Ej: Juan Pérez"
              maxLength={100}
              required
              aria-invalid={!!errors.ownerName}
              aria-describedby={errors.ownerName ? 'ownerName-error' : undefined}
              autoComplete="name"
            />
            {errors.ownerName && (
              <p 
                id="ownerName-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.ownerName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Negocio *
            </label>
            <input
              type="text"
              id="businessName"
              value={localData.businessName || ''}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.businessName ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Ej: Restaurante El Buen Sabor"
              maxLength={100}
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
            )}
          </div>

          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Negocio *
            </label>
            <select
              id="businessType"
              value={localData.businessType || ''}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.businessType ? 'border-red-300' : 'border-gray-300'}
              `}
            >
              <option value="">Seleccionar tipo</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.description}
                </option>
              ))}
            </select>
            {errors.businessType && (
              <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              id="phone"
              value={localData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.phone ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Ej: +52 55 1234 5678"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email de Contacto *
            </label>
            <input
              type="email"
              id="email"
              value={localData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.email ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="contacto@restaurante.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña *
            </label>
            <input
              type="password"
              id="password"
              value={localData.password || ''}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.password ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Debe contener mayúsculas, minúsculas y números
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={localData.confirmPassword || ''}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Repite tu contraseña"
              minLength={8}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Negocio
            </label>
            <textarea
              id="description"
              value={localData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Describe tu restaurante, especialidades, ambiente, etc."
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(localData.description || '').length}/500 caracteres
            </p>
          </div>
        </div>
      </Card>

      {/* Cuisine Types */}
      <Card 
        className={generateResponsiveSpacingClasses('p', { base: '4', tablet: '6' })}
        role="region"
        ariaLabelledBy="cuisine-heading"
      >
        <h3 
          className="text-lg font-semibold text-gray-900 mb-4"
          id="cuisine-heading"
        >
          Tipo de Cocina
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona los tipos de cocina que ofreces (puedes seleccionar varios)
        </p>
        
        <fieldset className="mb-4">
          <legend className="sr-only">Tipos de cocina disponibles</legend>
          <div 
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
            role="group"
            aria-labelledby="cuisine-heading"
          >
            {CUISINE_TYPES.map((cuisine, index) => (
              <button
                key={cuisine}
                type="button"
                onClick={() => handleCuisineToggle(cuisine)}
                className={`
                  px-3 py-2 text-sm rounded-md border transition-all duration-200
                  ${generateTouchFriendlyClasses('md')} ${generateFocusRingClasses()}
                  ${selectedCuisines.includes(cuisine)
                    ? 'bg-[#e4007c] text-white border-[#e4007c]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#e4007c] hover:text-[#e4007c]'
                  }
                `}
                aria-pressed={selectedCuisines.includes(cuisine)}
                aria-label={`${selectedCuisines.includes(cuisine) ? 'Deseleccionar' : 'Seleccionar'} ${cuisine}`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex space-x-2">
          <input
            type="text"
            value={customCuisine}
            onChange={(e) => setCustomCuisine(e.target.value)}
            placeholder="Agregar tipo personalizado"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCuisine()}
          />
          <button
            type="button"
            onClick={handleAddCustomCuisine}
            disabled={!customCuisine.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </div>

        {selectedCuisines.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Tipos seleccionados:</p>
            <div className="flex flex-wrap gap-2">
              {selectedCuisines.map((cuisine) => (
                <Badge key={cuisine} variant="secondary" className="flex items-center space-x-1">
                  <span>{cuisine}</span>
                  <button
                    type="button"
                    onClick={() => handleCuisineToggle(cuisine)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Operating Hours */}
      <Card 
        className={generateResponsiveSpacingClasses('p', { base: '4', tablet: '6' })}
        role="region"
        ariaLabelledBy="hours-heading"
      >
        <h3 
          className="text-lg font-semibold text-gray-900 mb-4"
          id="hours-heading"
        >
          Horarios de Operación
        </h3>
        
        <fieldset>
          <legend className="sr-only">Configurar horarios de operación por día</legend>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.id} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-32">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localData.operatingHours?.[day.id]?.isOpen || false}
                      onChange={(e) => handleOperatingHoursChange(day.id, 'isOpen', e.target.checked)}
                      className={`
                        h-4 w-4 text-[#e4007c] border-gray-300 rounded
                        ${generateFocusRingClasses('#e4007c')}
                      `}
                      aria-describedby={`${day.id}-hours-description`}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {day.name}
                    </span>
                  </label>
                </div>
              
                {localData.operatingHours?.[day.id]?.isOpen && (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <label htmlFor={`${day.id}-open`} className="sr-only">
                      Hora de apertura para {day.name}
                    </label>
                    <input
                      id={`${day.id}-open`}
                      type="time"
                      value={localData.operatingHours[day.id].openTime}
                      onChange={(e) => handleOperatingHoursChange(day.id, 'openTime', e.target.value)}
                      className={`
                        px-3 py-1 border border-gray-300 rounded-md shadow-sm
                        ${generateTouchFriendlyClasses('sm')} ${generateFocusRingClasses()}
                      `}
                      aria-label={`Hora de apertura para ${day.name}`}
                    />
                    <span className="text-gray-500 text-sm" aria-hidden="true">a</span>
                    <label htmlFor={`${day.id}-close`} className="sr-only">
                      Hora de cierre para {day.name}
                    </label>
                    <input
                      id={`${day.id}-close`}
                      type="time"
                      value={localData.operatingHours[day.id].closeTime}
                      onChange={(e) => handleOperatingHoursChange(day.id, 'closeTime', e.target.value)}
                      className={`
                        px-3 py-1 border border-gray-300 rounded-md shadow-sm
                        ${generateTouchFriendlyClasses('sm')} ${generateFocusRingClasses()}
                      `}
                      aria-label={`Hora de cierre para ${day.name}`}
                    />
                  </div>
                )}
                
                {!localData.operatingHours?.[day.id]?.isOpen && (
                  <span 
                    className="text-sm text-gray-500"
                    id={`${day.id}-hours-description`}
                  >
                    Cerrado
                  </span>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      </Card>

      {/* Additional Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Adicional
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad (personas)
            </label>
            <input
              type="number"
              id="capacity"
              value={localData.capacity || ''}
              onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="50"
              min="1"
            />
          </div>

          <div>
            <label htmlFor="deliveryRadius" className="block text-sm font-medium text-gray-700 mb-2">
              Radio de Entrega (km)
            </label>
            <input
              type="number"
              id="deliveryRadius"
              value={localData.deliveryRadius || ''}
              onChange={(e) => handleInputChange('deliveryRadius', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="5"
              min="0.1"
              step="0.1"
            />
          </div>

          <div>
            <label htmlFor="minimumOrder" className="block text-sm font-medium text-gray-700 mb-2">
              Pedido Mínimo ($)
            </label>
            <input
              type="number"
              id="minimumOrder"
              value={localData.minimumOrder || ''}
              onChange={(e) => handleInputChange('minimumOrder', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="100"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </Card>

      {/* Social Media & Website */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Presencia Digital (Opcional)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Sitio Web
            </label>
            <input
              type="url"
              id="website"
              value={localData.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="https://www.mirestaurante.com"
            />
          </div>

          <div>
            <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              id="facebook"
              value={localData.socialMedia?.facebook || ''}
              onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="https://facebook.com/mirestaurante"
            />
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="url"
              id="instagram"
              value={localData.socialMedia?.instagram || ''}
              onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="https://instagram.com/mirestaurante"
            />
          </div>

          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
              Twitter
            </label>
            <input
              type="url"
              id="twitter"
              value={localData.socialMedia?.twitter || ''}
              onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="https://twitter.com/mirestaurante"
            />
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <nav 
        className="flex flex-col sm:flex-row sm:justify-between gap-4"
        aria-label="Navegación del paso"
      >
        {onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={isLoading}
            className={`
              px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 bg-white 
              border border-gray-300 rounded-md hover:bg-gray-50 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              ${generateTouchFriendlyClasses('md')} ${generateFocusRingClasses()}
              order-2 sm:order-1
            `}
            aria-label={ACCESSIBILITY.ariaLabels.previous}
          >
            {ACCESSIBILITY.ariaLabels.previous}
          </button>
        )}
        
        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading || !validateForm()}
          className={`
            px-4 sm:px-6 py-2 text-sm font-medium text-white bg-[#e4007c] 
            border border-transparent rounded-md hover:bg-[#c6006b] 
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${generateTouchFriendlyClasses('md')} ${generateFocusRingClasses('#e4007c')}
            order-1 sm:order-2 ${!onPrevious ? 'ml-auto' : ''}
          `}
          aria-label={isLoading ? ACCESSIBILITY.ariaLabels.loading : 'Continuar al siguiente paso'}
          aria-busy={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Continuar'}
        </button>
      </nav>
    </div>
  );
}