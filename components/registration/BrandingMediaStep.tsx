// components/registration/BrandingMediaStep.tsx
"use client";

import { useState, useCallback } from 'react';
import { Card, Alert, Badge } from '@/components/ui';
import ImageUploader from '@/components/menu/ImageUploader';

export interface BrandingMedia {
  logo?: string;
  coverImage?: string;
  galleryImages: string[];
  brandColors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  brandDescription?: string;
  slogan?: string;
  socialMediaHandles: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  promotionalImages: string[];
  menuImages: string[];
}

export interface BrandingMediaStepProps {
  data: Partial<BrandingMedia>;
  onDataChange: (data: Partial<BrandingMedia>) => void;
  onNext: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
  onImageUpload?: (file: File, type: string) => Promise<string>;
}

const BRAND_COLOR_PRESETS = [
  { name: 'Rojo Clásico', primary: '#DC2626', secondary: '#FEE2E2', accent: '#991B1B' },
  { name: 'Naranja Vibrante', primary: '#EA580C', secondary: '#FED7AA', accent: '#C2410C' },
  { name: 'Verde Natural', primary: '#16A34A', secondary: '#DCFCE7', accent: '#15803D' },
  { name: 'Azul Profesional', primary: '#2563EB', secondary: '#DBEAFE', accent: '#1D4ED8' },
  { name: 'Morado Elegante', primary: '#9333EA', secondary: '#F3E8FF', accent: '#7C3AED' },
  { name: 'Rosa Moderno', primary: '#E11D48', secondary: '#FCE7F3', accent: '#BE185D' },
  { name: 'Amarillo Alegre', primary: '#EAB308', secondary: '#FEF3C7', accent: '#CA8A04' },
  { name: 'Gris Sofisticado', primary: '#374151', secondary: '#F3F4F6', accent: '#1F2937' }
];

export default function BrandingMediaStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading = false,
  errors = {},
  onImageUpload
}: BrandingMediaStepProps) {
  const [localData, setLocalData] = useState<Partial<BrandingMedia>>(data);
  const [selectedColorPreset, setSelectedColorPreset] = useState<string>('');

  const handleInputChange = useCallback((field: keyof BrandingMedia, value: any) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  }, [localData, onDataChange]);

  const handleBrandColorChange = useCallback((colorType: string, value: string) => {
    const updatedColors = {
      ...localData.brandColors,
      [colorType]: value
    };
    handleInputChange('brandColors', updatedColors);
  }, [localData.brandColors, handleInputChange]);

  const handleSocialMediaChange = useCallback((platform: string, value: string) => {
    const updatedSocialMedia = {
      ...localData.socialMediaHandles,
      [platform]: value
    };
    handleInputChange('socialMediaHandles', updatedSocialMedia);
  }, [localData.socialMediaHandles, handleInputChange]);

  const handleColorPresetSelect = useCallback((preset: typeof BRAND_COLOR_PRESETS[0]) => {
    setSelectedColorPreset(preset.name);
    handleInputChange('brandColors', {
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent
    });
  }, [handleInputChange]);

  const handleLogoUpload = useCallback(async (file: File) => {
    if (!onImageUpload) return '';
    const url = await onImageUpload(file, 'logo');
    handleInputChange('logo', url);
    return url;
  }, [onImageUpload, handleInputChange]);

  const handleCoverImageUpload = useCallback(async (file: File) => {
    if (!onImageUpload) return '';
    const url = await onImageUpload(file, 'cover');
    handleInputChange('coverImage', url);
    return url;
  }, [onImageUpload, handleInputChange]);

  const handleGalleryImageUpload = useCallback(async (file: File) => {
    if (!onImageUpload) return '';
    const url = await onImageUpload(file, 'gallery');
    const currentImages = localData.galleryImages || [];
    handleInputChange('galleryImages', [...currentImages, url]);
    return url;
  }, [onImageUpload, localData.galleryImages, handleInputChange]);

  const handlePromotionalImageUpload = useCallback(async (file: File) => {
    if (!onImageUpload) return '';
    const url = await onImageUpload(file, 'promotional');
    const currentImages = localData.promotionalImages || [];
    handleInputChange('promotionalImages', [...currentImages, url]);
    return url;
  }, [onImageUpload, localData.promotionalImages, handleInputChange]);

  const removeGalleryImage = useCallback((index: number) => {
    const currentImages = localData.galleryImages || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    handleInputChange('galleryImages', updatedImages);
  }, [localData.galleryImages, handleInputChange]);

  const removePromotionalImage = useCallback((index: number) => {
    const currentImages = localData.promotionalImages || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    handleInputChange('promotionalImages', updatedImages);
  }, [localData.promotionalImages, handleInputChange]);

  const validateForm = useCallback((): boolean => {
    // Logo is required, other elements are optional but recommended
    return !!localData.logo;
  }, [localData.logo]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      onNext();
    }
  }, [validateForm, onNext]);

  const getCompletionPercentage = useCallback(() => {
    const fields = [
      localData.logo,
      localData.coverImage,
      localData.brandDescription,
      localData.slogan,
      localData.brandColors?.primary,
      (localData.galleryImages?.length || 0) > 0,
      Object.values(localData.socialMediaHandles || {}).some(handle => handle)
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [localData]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Imagen de Marca y Medios
        </h2>
        <p className="text-gray-600">
          Crea la identidad visual de tu restaurante para atraer más clientes
        </p>
        <div className="mt-4">
          <Badge variant={getCompletionPercentage() >= 70 ? 'success' : 'warning'}>
            {getCompletionPercentage()}% completado
          </Badge>
        </div>
      </div>

      {/* Logo Upload */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Logo del Restaurante *
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Sube el logo de tu restaurante. Se mostrará en tu perfil y en todas las comunicaciones.
        </p>
        
        <ImageUploader
          onUpload={handleLogoUpload}
          onRemove={() => handleInputChange('logo', undefined)}
          requirements={{
            minWidth: 200,
            minHeight: 200,
            maxWidth: 1000,
            maxHeight: 1000,
            maxSize: 2 * 1024 * 1024, // 2MB
            formats: ['image/jpeg', 'image/png', 'image/webp'],
            quality: 0.9,
            autoOptimize: true,
            generateThumbnail: true
          }}
          preview={localData.logo}
          aspectRatio={1} // Square logo
          cropEnabled={true}
          label="Subir logo"
          description="Preferiblemente cuadrado, fondo transparente o blanco"
          showPreview={true}
          showMetadata={true}
        />
        
        {errors.logo && (
          <Alert variant="error" className="mt-4">
            {errors.logo}
          </Alert>
        )}
      </Card>

      {/* Cover Image */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Imagen de Portada
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Una imagen atractiva que represente tu restaurante. Se mostrará como banner en tu perfil.
        </p>
        
        <ImageUploader
          onUpload={handleCoverImageUpload}
          onRemove={() => handleInputChange('coverImage', undefined)}
          requirements={{
            minWidth: 800,
            minHeight: 400,
            maxWidth: 2000,
            maxHeight: 1000,
            maxSize: 5 * 1024 * 1024, // 5MB
            formats: ['image/jpeg', 'image/png', 'image/webp'],
            quality: 0.9,
            autoOptimize: true,
            generateThumbnail: true
          }}
          preview={localData.coverImage}
          aspectRatio={2} // 2:1 ratio for cover
          cropEnabled={true}
          label="Subir imagen de portada"
          description="Imagen horizontal que muestre el ambiente de tu restaurante"
          showPreview={true}
          showMetadata={true}
        />
      </Card>

      {/* Brand Identity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Identidad de Marca
        </h3>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="brandDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la Marca
            </label>
            <textarea
              id="brandDescription"
              value={localData.brandDescription || ''}
              onChange={(e) => handleInputChange('brandDescription', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Describe la personalidad y valores de tu restaurante. ¿Qué te hace único? ¿Cuál es tu historia?"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {(localData.brandDescription || '').length}/500 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="slogan" className="block text-sm font-medium text-gray-700 mb-2">
              Eslogan o Frase Distintiva
            </label>
            <input
              type="text"
              id="slogan"
              value={localData.slogan || ''}
              onChange={(e) => handleInputChange('slogan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="Ej: 'Sabor auténtico desde 1985' o 'La mejor comida casera de la ciudad'"
              maxLength={100}
            />
          </div>
        </div>
      </Card>

      {/* Brand Colors */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Colores de Marca
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona los colores que representen tu marca. Se usarán en tu perfil y materiales promocionales.
        </p>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Paletas Predefinidas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BRAND_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleColorPresetSelect(preset)}
                  className={`
                    p-3 border rounded-lg transition-colors
                    ${selectedColorPreset === preset.name
                      ? 'border-[#e4007c] bg-[#fef2f9]'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex space-x-1 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.secondary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-gray-700">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Colores Personalizados</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Primario
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={localData.brandColors?.primary || '#e4007c'}
                    onChange={(e) => handleBrandColorChange('primary', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localData.brandColors?.primary || ''}
                    onChange={(e) => handleBrandColorChange('primary', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                    placeholder="#e4007c"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Secundario
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={localData.brandColors?.secondary || '#f8f9fa'}
                    onChange={(e) => handleBrandColorChange('secondary', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localData.brandColors?.secondary || ''}
                    onChange={(e) => handleBrandColorChange('secondary', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                    placeholder="#f8f9fa"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color de Acento
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    id="accentColor"
                    value={localData.brandColors?.accent || '#c6006b'}
                    onChange={(e) => handleBrandColorChange('accent', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localData.brandColors?.accent || ''}
                    onChange={(e) => handleBrandColorChange('accent', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                    placeholder="#c6006b"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Social Media */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Redes Sociales
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Conecta tus redes sociales para que los clientes puedan seguirte y compartir tu contenido.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                facebook.com/
              </span>
              <input
                type="text"
                id="facebook"
                value={localData.socialMediaHandles?.facebook || ''}
                onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                placeholder="mirestaurante"
              />
            </div>
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                @
              </span>
              <input
                type="text"
                id="instagram"
                value={localData.socialMediaHandles?.instagram || ''}
                onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                placeholder="mirestaurante"
              />
            </div>
          </div>

          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
              Twitter
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                @
              </span>
              <input
                type="text"
                id="twitter"
                value={localData.socialMediaHandles?.twitter || ''}
                onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                placeholder="mirestaurante"
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Business
            </label>
            <input
              type="tel"
              id="whatsapp"
              value={localData.socialMediaHandles?.whatsapp || ''}
              onChange={(e) => handleSocialMediaChange('whatsapp', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
              placeholder="+52 55 1234 5678"
            />
          </div>
        </div>
      </Card>

      {/* Gallery Images */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Galería de Imágenes
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Sube fotos del ambiente, platillos y equipo de tu restaurante. Máximo 10 imágenes.
        </p>
        
        {(localData.galleryImages?.length || 0) < 10 && (
          <ImageUploader
            onUpload={handleGalleryImageUpload}
            requirements={{
              minWidth: 400,
              minHeight: 300,
              maxWidth: 2000,
              maxHeight: 2000,
              maxSize: 5 * 1024 * 1024, // 5MB
              formats: ['image/jpeg', 'image/png', 'image/webp'],
              quality: 0.9,
              autoOptimize: true
            }}
            aspectRatio={4/3}
            cropEnabled={true}
            label="Agregar imagen a la galería"
            description="Fotos del restaurante, ambiente, platillos, etc."
            showPreview={false}
          />
        )}

        {localData.galleryImages && localData.galleryImages.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Imágenes en la galería ({localData.galleryImages.length}/10)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {localData.galleryImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Galería ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

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
          onClick={handleNext}
          disabled={isLoading || !validateForm()}
          className="px-6 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          {isLoading ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}