// components/demo/MenuBuilderDemo.tsx
"use client";

import { useState, useCallback } from 'react';
import { Card, Badge, Alert } from '@/components/ui';
import MenuItemEditor, { MenuItem, MenuCategory } from '@/components/menu/MenuItemEditor';
import CategoryManager from '@/components/menu/CategoryManager';
import { ImageMetadata } from '@/components/menu/ImageUploader';

// Sample categories for demo
const SAMPLE_CATEGORIES: MenuCategory[] = [
  { id: 'appetizers', name: 'Entradas', description: 'Aperitivos y botanas', sortOrder: 1, isActive: true },
  { id: 'mains', name: 'Platos Principales', description: 'Platillos principales', sortOrder: 2, isActive: true },
  { id: 'tacos', name: 'Tacos', description: 'Variedad de tacos', sortOrder: 3, isActive: true },
  { id: 'desserts', name: 'Postres', description: 'Dulces y postres', sortOrder: 4, isActive: true },
  { id: 'beverages', name: 'Bebidas', description: 'Bebidas y refrescos', sortOrder: 5, isActive: true },
];

// Sample menu items for demo
const SAMPLE_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Tacos al Pastor',
    description: 'Deliciosos tacos al pastor con carne marinada en achiote, piña asada, cebolla y cilantro. Servidos en tortillas de maíz recién hechas con salsa verde y roja. **Especialidad de la casa** - preparados con receta tradicional familiar.',
    price: 85.00,
    category: 'tacos',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    ingredients: ['Carne de cerdo', 'Piña', 'Cebolla', 'Cilantro', 'Tortillas de maíz'],
    allergens: [{ id: 'gluten', name: 'Gluten', icon: '🌾' }],
    dietary: [{ id: 'spicy', name: 'Picante', icon: '🌶️', color: 'red' }],
    preparationTime: 15,
    available: true,
    sortOrder: 1
  },
  {
    id: '2',
    name: 'Ensalada César Vegana',
    description: 'Ensalada fresca con lechuga romana, crutones caseros, aderezo césar vegano y queso vegetal. Una opción saludable y deliciosa.',
    price: 120.00,
    category: 'mains',
    ingredients: ['Lechuga romana', 'Crutones', 'Aderezo césar vegano', 'Queso vegetal'],
    allergens: [{ id: 'gluten', name: 'Gluten', icon: '🌾' }],
    dietary: [
      { id: 'vegan', name: 'Vegano', icon: '🌱', color: 'green' },
      { id: 'healthy', name: 'Saludable', icon: '💚', color: 'green' }
    ],
    preparationTime: 10,
    available: true,
    sortOrder: 2
  }
];

export default function MenuBuilderDemo() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SAMPLE_ITEMS);
  const [categories, setCategories] = useState<MenuCategory[]>(SAMPLE_CATEGORIES);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'categories'>('menu');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveItem = useCallback(async (itemData: Omit<MenuItem, 'id'> | MenuItem) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if ('id' in itemData) {
        // Update existing item
        setMenuItems(prev => prev.map(item => 
          item.id === itemData.id ? itemData : item
        ));
        setMessage({ type: 'success', text: `Platillo "${itemData.name}" actualizado exitosamente` });
      } else {
        // Create new item
        const newItem: MenuItem = {
          ...itemData,
          id: Date.now().toString(),
          sortOrder: menuItems.length + 1
        };
        setMenuItems(prev => [...prev, newItem]);
        setMessage({ type: 'success', text: `Platillo "${itemData.name}" creado exitosamente` });
      }

      setEditingItem(null);
      setIsCreating(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al guardar el platillo' 
      });
    }
  }, [menuItems.length]);

  const handleImageUpload = useCallback(async (file: File, metadata?: ImageMetadata): Promise<string> => {
    // Simulate image upload with processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log metadata for demo purposes
    if (metadata) {
      console.log('📸 Imagen procesada:', {
        originalSize: `${metadata.originalSize.width}x${metadata.originalSize.height}px`,
        processedSize: `${metadata.processedSize.width}x${metadata.processedSize.height}px`,
        fileSize: `${(metadata.fileSize / 1024).toFixed(1)}KB`,
        format: metadata.format,
        quality: `${Math.round(metadata.quality * 100)}%`,
        hasThumbnail: !!metadata.thumbnail,
        wasCropped: !!metadata.cropArea
      });
    }
    
    // In a real app, this would upload to your storage service
    // For demo, we'll use the object URL
    return URL.createObjectURL(file);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingItem(null);
    setIsCreating(false);
  }, []);

  const handleEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setIsCreating(false);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingItem(null);
    setIsCreating(true);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    setMessage({ type: 'success', text: 'Platillo eliminado exitosamente' });
  }, []);

  // Category management functions
  const handleCategoryAdd = useCallback(async (categoryData: Omit<MenuCategory, 'id'>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newCategory: MenuCategory = {
        ...categoryData,
        id: Date.now().toString()
      };
      setCategories(prev => [...prev, newCategory]);
      setMessage({ type: 'success', text: `Categoría "${categoryData.name}" creada exitosamente` });
    } catch (error) {
      throw new Error('Error al crear la categoría');
    }
  }, []);

  const handleCategoryUpdate = useCallback(async (id: string, updates: Partial<MenuCategory>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      ));
      setMessage({ type: 'success', text: 'Categoría actualizada exitosamente' });
    } catch (error) {
      throw new Error('Error al actualizar la categoría');
    }
  }, []);

  const handleCategoryDelete = useCallback(async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setMessage({ type: 'success', text: 'Categoría eliminada exitosamente' });
    } catch (error) {
      throw new Error('Error al eliminar la categoría');
    }
  }, []);

  const handleCategoryReorder = useCallback(async (reorderedCategories: MenuCategory[]) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setCategories(reorderedCategories);
      setMessage({ type: 'success', text: 'Categorías reordenadas exitosamente' });
    } catch (error) {
      throw new Error('Error al reordenar las categorías');
    }
  }, []);

  const handleMenuItemUpdate = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setMenuItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      setMessage({ type: 'success', text: 'Platillo actualizado exitosamente' });
    } catch (error) {
      throw new Error('Error al actualizar el platillo');
    }
  }, []);

  const handleMenuItemReorder = useCallback(async (categoryId: string, reorderedItems: MenuItem[]) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setMenuItems(prev => {
        const otherItems = prev.filter(item => item.category !== categoryId);
        return [...otherItems, ...reorderedItems];
      });
      setMessage({ type: 'success', text: 'Platillos reordenados exitosamente' });
    } catch (error) {
      throw new Error('Error al reordenar los platillos');
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demo: Sistema de Menú Completo
        </h1>
        <p className="text-lg text-gray-600">
          Sistema completo de gestión de menú con editor enriquecido, gestión de categorías y organización
        </p>
      </div>

      {message && (
        <Alert 
          variant={message.type === 'success' ? 'success' : 'error'}
          dismissible
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {(isCreating || editingItem) ? (
        <MenuItemEditor
          item={editingItem || undefined}
          categories={categories}
          onSave={handleSaveItem}
          onCancel={handleCancel}
          onImageUpload={handleImageUpload}
        />
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestión de Menú
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {categories.length} categorías • {menuItems.length} platillos en el menú
                </p>
              </div>
              {activeTab === 'menu' && (
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-[#e4007c] text-white rounded-md hover:bg-[#c6006b] transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Agregar Platillo</span>
                </button>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'menu'
                      ? 'border-[#e4007c] text-[#e4007c]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  Platillos
                  <Badge variant="secondary" size="sm" className="ml-2">
                    {menuItems.length}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'categories'
                      ? 'border-[#e4007c] text-[#e4007c]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  Categorías
                  <Badge variant="secondary" size="sm" className="ml-2">
                    {categories.length}
                  </Badge>
                </button>
              </nav>
            </div>
          </Card>

          {/* Tab Content */}
          {activeTab === 'categories' ? (
            <CategoryManager
              categories={categories}
              menuItems={menuItems}
              onCategoryAdd={handleCategoryAdd}
              onCategoryUpdate={handleCategoryUpdate}
              onCategoryDelete={handleCategoryDelete}
              onCategoryReorder={handleCategoryReorder}
              onMenuItemUpdate={handleMenuItemUpdate}
              onMenuItemReorder={handleMenuItemReorder}
              onMenuItemEdit={handleEditItem}
              showMenuItems={true}
            />
          ) : (
            <div className="space-y-6">
              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {item.image && (
                      <div className="aspect-video bg-gray-200">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <Badge 
                          variant={item.available ? 'success' : 'default'}
                          size="sm"
                        >
                          {item.available ? 'Disponible' : 'No disponible'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-[#e4007c]">
                          ${item.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ⏱️ {item.preparationTime} min
                        </div>
                      </div>

                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Ingredientes:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.ingredients.slice(0, 3).map((ingredient, index) => (
                              <Badge key={index} variant="secondary" size="sm">
                                {ingredient}
                              </Badge>
                            ))}
                            {item.ingredients.length > 3 && (
                              <Badge variant="secondary" size="sm">
                                +{item.ingredients.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {item.dietary && item.dietary.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.dietary.map((dietary) => (
                            <Badge key={dietary.id} variant="info" size="sm">
                              {dietary.icon} {dietary.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-[#e4007c] border border-[#e4007c] rounded-md hover:bg-[#fef2f9] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {menuItems.length === 0 && (
                <Card className="p-12 text-center">
                  <div className="space-y-4">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No hay platillos en el menú
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Comienza agregando tu primer platillo al menú
                      </p>
                    </div>
                    <button
                      onClick={handleCreateNew}
                      className="px-4 py-2 bg-[#e4007c] text-white rounded-md hover:bg-[#c6006b] transition-colors"
                    >
                      Agregar Primer Platillo
                    </button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Features Showcase */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✨ Características del Sistema de Menú Completo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Editor de texto enriquecido con formato</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Validación avanzada de precios en MXN</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Gestión inteligente de ingredientes</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Información dietética y alérgenos</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Tiempo de preparación con botones rápidos</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✓</span>
            <span>Vista previa en tiempo real</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Gestión completa de categorías</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Drag & drop para reordenar categorías</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Drag & drop para reordenar platillos</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Toggle de disponibilidad de platillos</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Filtrado por categorías</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">✓</span>
            <span>Vista expandible de platillos por categoría</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-500">✓</span>
            <span>Subida de imágenes con recorte avanzado</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-500">✓</span>
            <span>Optimización automática de imágenes</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-500">✓</span>
            <span>Conversión de formatos y compresión</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-500">✓</span>
            <span>Generación automática de miniaturas</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-500">✓</span>
            <span>Validación de dimensiones y formatos</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-500">✓</span>
            <span>Estadísticas de optimización en tiempo real</span>
          </div>
        </div>
      </Card>
    </div>
  );
}