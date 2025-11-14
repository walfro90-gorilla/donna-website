// components/menu/MenuItemEditor.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Badge, Alert } from '@/components/ui';
import ImageUploader from './ImageUploader';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  ingredients?: string[];
  allergens?: Allergen[];
  dietary?: DietaryInfo[];
  preparationTime?: number;
  available: boolean;
  sortOrder?: number;
}

export interface Allergen {
  id: string;
  name: string;
  icon?: string;
}

export interface DietaryInfo {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItemEditorProps {
  item?: MenuItem;
  categories: MenuCategory[];
  onSave: (item: Omit<MenuItem, 'id'> | MenuItem) => Promise<void>;
  onCancel: () => void;
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
}

// Common allergens for Mexican/Latin American cuisine
const COMMON_ALLERGENS: Allergen[] = [
  { id: 'gluten', name: 'Gluten', icon: '🌾' },
  { id: 'dairy', name: 'Lácteos', icon: '🥛' },
  { id: 'eggs', name: 'Huevos', icon: '🥚' },
  { id: 'nuts', name: 'Frutos secos', icon: '🥜' },
  { id: 'soy', name: 'Soja', icon: '🫘' },
  { id: 'shellfish', name: 'Mariscos', icon: '🦐' },
  { id: 'fish', name: 'Pescado', icon: '🐟' },
  { id: 'sesame', name: 'Sésamo', icon: '🌰' }
];

// Dietary information options
const DIETARY_OPTIONS: DietaryInfo[] = [
  { id: 'vegetarian', name: 'Vegetariano', icon: '🥬', color: 'green' },
  { id: 'vegan', name: 'Vegano', icon: '🌱', color: 'green' },
  { id: 'gluten-free', name: 'Sin Gluten', icon: '🚫', color: 'blue' },
  { id: 'dairy-free', name: 'Sin Lácteos', icon: '🚫', color: 'blue' },
  { id: 'keto', name: 'Keto', icon: '🥑', color: 'purple' },
  { id: 'low-carb', name: 'Bajo en Carbohidratos', icon: '📉', color: 'orange' },
  { id: 'spicy', name: 'Picante', icon: '🌶️', color: 'red' },
  { id: 'healthy', name: 'Saludable', icon: '💚', color: 'green' }
];

export default function MenuItemEditor({
  item,
  categories,
  onSave,
  onCancel,
  onImageUpload,
  className = ''
}: MenuItemEditorProps) {
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || categories[0]?.id || '',
    image: item?.image || '',
    ingredients: item?.ingredients || [],
    allergens: item?.allergens || [],
    dietary: item?.dietary || [],
    preparationTime: item?.preparationTime || 15,
    available: item?.available ?? true,
    ...item
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [priceInput, setPriceInput] = useState(item?.price?.toString() || '');
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced price validation with currency formatting
  const validatePrice = useCallback((priceStr: string): { isValid: boolean; error?: string; value?: number } => {
    if (!priceStr.trim()) {
      return { isValid: false, error: 'El precio es requerido' };
    }

    // Remove currency symbols and spaces for validation
    const cleanPrice = priceStr.replace(/[$,\s]/g, '');
    const numericPrice = parseFloat(cleanPrice);

    if (isNaN(numericPrice)) {
      return { isValid: false, error: 'Ingrese un precio válido' };
    }

    if (numericPrice <= 0) {
      return { isValid: false, error: 'El precio debe ser mayor a $0.00' };
    }

    if (numericPrice < 1) {
      return { isValid: false, error: 'El precio mínimo es $1.00' };
    }

    if (numericPrice > 10000) {
      return { isValid: false, error: 'El precio no puede exceder $10,000.00' };
    }

    // Check for reasonable decimal places (max 2)
    const decimalPlaces = (cleanPrice.split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return { isValid: false, error: 'El precio no puede tener más de 2 decimales' };
    }

    return { isValid: true, value: numericPrice };
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre del platillo es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Enhanced description validation
    if (!formData.description?.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 20) {
      newErrors.description = 'La descripción debe tener al menos 20 caracteres para ser informativa';
    } else if (formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    // Enhanced price validation
    const priceValidation = validatePrice(priceInput);
    if (!priceValidation.isValid) {
      newErrors.price = priceValidation.error!;
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Debe seleccionar una categoría';
    }

    // Preparation time validation
    if (!formData.preparationTime || formData.preparationTime < 1) {
      newErrors.preparationTime = 'El tiempo de preparación debe ser al menos 1 minuto';
    } else if (formData.preparationTime > 180) {
      newErrors.preparationTime = 'El tiempo de preparación no puede exceder 180 minutos';
    }

    // Ingredients validation (optional but recommended)
    if (!formData.ingredients || formData.ingredients.length === 0) {
      newErrors.ingredients = 'Se recomienda agregar al menos un ingrediente principal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, priceInput, validatePrice]);

  // Enhanced currency formatting
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const handleInputChange = useCallback((field: keyof MenuItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Enhanced price input handler with real-time formatting
  const handlePriceChange = useCallback((value: string) => {
    setPriceInput(value);
    
    const priceValidation = validatePrice(value);
    if (priceValidation.isValid && priceValidation.value) {
      handleInputChange('price', priceValidation.value);
    }
    
    // Clear price error when user starts typing
    if (errors.price) {
      setErrors(prev => ({ ...prev, price: '' }));
    }
  }, [validatePrice, handleInputChange, errors.price]);

  // Enhanced description handler with word count
  const handleDescriptionChange = useCallback((value: string) => {
    handleInputChange('description', value);
    
    // Calculate word count for better UX
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    setDescriptionWordCount(wordCount);
  }, [handleInputChange]);



  const handleAddIngredient = useCallback(() => {
    if (!newIngredient.trim()) return;
    
    const ingredients = formData.ingredients || [];
    if (!ingredients.includes(newIngredient.trim())) {
      handleInputChange('ingredients', [...ingredients, newIngredient.trim()]);
    }
    setNewIngredient('');
  }, [newIngredient, formData.ingredients, handleInputChange]);

  const handleRemoveIngredient = useCallback((ingredient: string) => {
    const ingredients = formData.ingredients || [];
    handleInputChange('ingredients', ingredients.filter(i => i !== ingredient));
  }, [formData.ingredients, handleInputChange]);

  const handleAllergenToggle = useCallback((allergen: Allergen) => {
    const allergens = formData.allergens || [];
    const exists = allergens.some(a => a.id === allergen.id);
    
    if (exists) {
      handleInputChange('allergens', allergens.filter(a => a.id !== allergen.id));
    } else {
      handleInputChange('allergens', [...allergens, allergen]);
    }
  }, [formData.allergens, handleInputChange]);

  const handleDietaryToggle = useCallback((dietary: DietaryInfo) => {
    const dietaryInfo = formData.dietary || [];
    const exists = dietaryInfo.some(d => d.id === dietary.id);
    
    if (exists) {
      handleInputChange('dietary', dietaryInfo.filter(d => d.id !== dietary.id));
    } else {
      handleInputChange('dietary', [...dietaryInfo, dietary]);
    }
  }, [formData.dietary, handleInputChange]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.focus();
      }
      return;
    }

    setIsLoading(true);
    try {
      const priceValidation = validatePrice(priceInput);
      const finalPrice = priceValidation.value || 0;

      const itemData = {
        ...formData,
        name: formData.name!.trim(),
        description: formData.description!.trim(),
        price: finalPrice,
        category: formData.category!,
        ingredients: formData.ingredients || [],
        allergens: formData.allergens || [],
        dietary: formData.dietary || [],
        preparationTime: Number(formData.preparationTime),
        available: Boolean(formData.available)
      } as MenuItem;

      await onSave(itemData);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Error al guardar el platillo'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onSave, priceInput, validatePrice, errors]);

  // Initialize price input when item changes
  useEffect(() => {
    if (item?.price) {
      setPriceInput(item.price.toString());
    }
  }, [item]);

  // Initialize description word count
  useEffect(() => {
    if (formData.description) {
      const wordCount = formData.description.trim() ? formData.description.trim().split(/\s+/).length : 0;
      setDescriptionWordCount(wordCount);
    }
  }, [formData.description]);

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Editar Platillo' : 'Agregar Nuevo Platillo'}
          </h2>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="menu-item-form"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar Platillo'}
            </button>
          </div>
        </div>

        {errors.submit && (
          <Alert variant="error" className="mb-6">
            {errors.submit}
          </Alert>
        )}

        <form id="menu-item-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Información Básica
                </h3>
                
                {/* Name Field */}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Platillo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                      ${errors.name ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Ej: Tacos al Pastor"
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {(formData.name || '').length}/100 caracteres
                  </p>
                </div>

                {/* Category Field */}
                <div className="mb-4">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                      ${errors.category ? 'border-red-300' : 'border-gray-300'}
                    `}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Price and Preparation Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Precio * <span className="text-xs text-gray-500">(MXN)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 font-medium">$</span>
                      <input
                        type="text"
                        id="price"
                        value={priceInput}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className={`
                          w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] transition-colors
                          ${errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="0.00"
                        autoComplete="off"
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.price}
                      </p>
                    )}
                    {priceInput && !errors.price && (() => {
                      const validation = validatePrice(priceInput);
                      return validation.isValid && validation.value ? (
                        <p className="mt-1 text-xs text-green-600 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {formatCurrency(validation.value)}
                        </p>
                      ) : null;
                    })()}
                  </div>

                  <div>
                    <label htmlFor="preparationTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Preparación *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="preparationTime"
                        value={formData.preparationTime || ''}
                        onChange={(e) => handleInputChange('preparationTime', parseInt(e.target.value) || 0)}
                        className={`
                          w-full px-3 py-2 pr-12 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] transition-colors
                          ${errors.preparationTime ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="15"
                        min="1"
                        max="180"
                      />
                      <span className="absolute right-3 top-2 text-gray-500 text-sm font-medium">min</span>
                    </div>
                    {errors.preparationTime && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.preparationTime}
                      </p>
                    )}
                    {formData.preparationTime && !errors.preparationTime && (
                      <p className="mt-1 text-xs text-gray-500">
                        ⏱️ Los clientes verán: "Listo en {formData.preparationTime} minutos"
                      </p>
                    )}
                    
                    {/* Quick time selection buttons */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[5, 10, 15, 20, 30, 45].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleInputChange('preparationTime', time)}
                          className={`
                            px-2 py-1 text-xs rounded border transition-colors
                            ${formData.preparationTime === time
                              ? 'bg-[#e4007c] text-white border-[#e4007c]'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-[#e4007c] hover:text-[#e4007c]'
                            }
                          `}
                        >
                          {time}min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available || false}
                    onChange={(e) => handleInputChange('available', e.target.checked)}
                    className="h-4 w-4 text-[#e4007c] focus:ring-[#e4007c] border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Disponible para pedidos
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Enhanced Image Upload */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Imagen del Platillo
                </h3>
                
                <ImageUploader
                  onUpload={async (file) => {
                    if (!onImageUpload) {
                      throw new Error('Función de subida no disponible');
                    }
                    const imageUrl = await onImageUpload(file);
                    handleInputChange('image', imageUrl);
                    return imageUrl;
                  }}
                  onRemove={() => handleInputChange('image', '')}
                  requirements={{
                    minWidth: 400,
                    minHeight: 300,
                    maxWidth: 2000,
                    maxHeight: 2000,
                    maxSize: 5 * 1024 * 1024, // 5MB
                    formats: ['image/jpeg', 'image/png', 'image/webp'],
                    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                    quality: 0.9,
                    autoOptimize: true,
                    generateThumbnail: true,
                    thumbnailSize: 150
                  }}
                  preview={formData.image}
                  aspectRatio={4/3} // Good ratio for food images
                  cropEnabled={true}
                  label="Subir imagen del platillo"
                  description="Imagen principal que verán los clientes. Se recomienda una foto atractiva y bien iluminada del platillo."
                  showPreview={true}
                  showMetadata={true}
                />
                
                {errors.image && (
                  <Alert variant="error" className="mt-2">
                    {errors.image}
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Description with Rich Text Features */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Platillo *
              <span className="text-xs text-gray-500 ml-2">
                (Incluye ingredientes, sabor, preparación)
              </span>
            </label>
            
            {/* Rich Text Toolbar */}
            <div className="border border-gray-300 rounded-t-md bg-gray-50 px-3 py-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const textarea = descriptionRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = textarea.value.substring(start, end);
                    const newText = textarea.value.substring(0, start) + `**${selectedText}**` + textarea.value.substring(end);
                    handleDescriptionChange(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 2, end + 2);
                    }, 0);
                  }
                }}
                className="px-2 py-1 text-xs font-bold border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Texto en negritas"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  const textarea = descriptionRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = textarea.value.substring(start, end);
                    const newText = textarea.value.substring(0, start) + `*${selectedText}*` + textarea.value.substring(end);
                    handleDescriptionChange(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 1, end + 1);
                    }, 0);
                  }
                }}
                className="px-2 py-1 text-xs italic border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Texto en cursiva"
              >
                <em>I</em>
              </button>
              <div className="border-l border-gray-300 h-4 mx-2"></div>
              <span className="text-xs text-gray-500">
                Usa **texto** para negritas, *texto* para cursiva
              </span>
            </div>

            <textarea
              ref={descriptionRef}
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={5}
              className={`
                w-full px-3 py-3 border-t-0 border border-gray-300 rounded-b-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] transition-colors resize-none
                ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              placeholder="Ejemplo: Deliciosos tacos al pastor con carne marinada en achiote, piña asada, cebolla y cilantro. Servidos en tortillas de maíz recién hechas con salsa verde y roja. **Especialidad de la casa** - preparados con receta tradicional familiar."
              maxLength={500}
            />
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center space-x-4">
                {errors.description ? (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.description}
                  </p>
                ) : (
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>📝 {descriptionWordCount} palabras</span>
                    {descriptionWordCount >= 15 && (
                      <span className="text-green-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Descripción completa
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {(formData.description || '').length}/500 caracteres
              </p>
            </div>

            {/* Description Preview */}
            {formData.description && formData.description.length > 20 && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-2">Vista previa:</p>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {formData.description
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .split('\n')
                    .map((line, index) => (
                      <p key={index} dangerouslySetInnerHTML={{ __html: line || '<br>' }} />
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Ingredients Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ingredientes Principales
              </h3>
              <span className="text-xs text-gray-500">
                {formData.ingredients?.length || 0} ingredientes
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Lista los ingredientes principales que los clientes deben conocer (especialmente para alergias)
            </p>
            
            <div className="flex space-x-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddIngredient();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c] transition-colors"
                  placeholder="Ej: Carne de cerdo, piña, cebolla..."
                  maxLength={50}
                />
                {newIngredient && (
                  <div className="absolute right-2 top-2 text-xs text-gray-400">
                    {newIngredient.length}/50
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                disabled={!newIngredient.trim() || (formData.ingredients?.includes(newIngredient.trim()) || false)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Agregar
              </button>
            </div>
            
            {errors.ingredients && (
              <p className="mb-3 text-sm text-amber-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.ingredients}
              </p>
            )}
            
            {formData.ingredients && formData.ingredients.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-2 px-3 py-1"
                    >
                      <span className="text-sm">{ingredient}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(ingredient)}
                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                        title={`Eliminar ${ingredient}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {formData.ingredients.length >= 3 && (
                  <p className="text-xs text-green-600 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Lista de ingredientes completa
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm text-gray-500">
                  Agrega ingredientes principales para informar mejor a tus clientes
                </p>
              </div>
            )}
          </div>

          {/* Allergens */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Alérgenos
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona los alérgenos presentes en este platillo
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COMMON_ALLERGENS.map((allergen) => {
                const isSelected = formData.allergens?.some(a => a.id === allergen.id) || false;
                return (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => handleAllergenToggle(allergen)}
                    className={`
                      p-3 border rounded-lg text-sm font-medium transition-colors
                      ${isSelected
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-lg">{allergen.icon}</span>
                      <span>{allergen.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información Dietética
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona las características dietéticas que aplican
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIETARY_OPTIONS.map((dietary) => {
                const isSelected = formData.dietary?.some(d => d.id === dietary.id) || false;
                return (
                  <button
                    key={dietary.id}
                    type="button"
                    onClick={() => handleDietaryToggle(dietary)}
                    className={`
                      p-3 border rounded-lg text-sm font-medium transition-colors
                      ${isSelected
                        ? `border-${dietary.color}-300 bg-${dietary.color}-50 text-${dietary.color}-700`
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-lg">{dietary.icon}</span>
                      <span>{dietary.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}