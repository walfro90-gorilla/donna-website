// components/registration/MenuCreationStep.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import { Card, Alert, Badge } from '@/components/ui';
import MenuItemEditor, { MenuItem, MenuCategory } from '@/components/menu/MenuItemEditor';
import CategoryManager from '@/components/menu/CategoryManager';

export interface MenuCreation {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  isMenuComplete: boolean;
  menuPreviewMode: boolean;
}

export interface MenuCreationStepProps {
  data: Partial<MenuCreation>;
  onDataChange: (data: Partial<MenuCreation>) => void;
  onNext: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
  onImageUpload?: (file: File) => Promise<string>;
  minimumItems?: number;
}

const DEFAULT_CATEGORIES: MenuCategory[] = [
  { id: 'appetizers', name: 'Entradas', description: 'Aperitivos y botanas', sortOrder: 1, isActive: true },
  { id: 'mains', name: 'Platos Principales', description: 'Platillos principales', sortOrder: 2, isActive: true },
  { id: 'desserts', name: 'Postres', description: 'Dulces y postres', sortOrder: 3, isActive: true },
  { id: 'beverages', name: 'Bebidas', description: 'Bebidas y refrescos', sortOrder: 4, isActive: true }
];

export default function MenuCreationStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLoading = false,
  errors = {},
  onImageUpload,
  minimumItems = 15
}: MenuCreationStepProps) {
  const [localData, setLocalData] = useState<Partial<MenuCreation>>({
    categories: DEFAULT_CATEGORIES,
    menuItems: [],
    isMenuComplete: false,
    menuPreviewMode: false,
    ...data
  });
  
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleDataChange = useCallback((updates: Partial<MenuCreation>) => {
    const updatedData = { ...localData, ...updates };
    setLocalData(updatedData);
    onDataChange(updatedData);
  }, [localData, onDataChange]);

  // Menu statistics
  const menuStats = useMemo(() => {
    const items = localData.menuItems || [];
    const categories = localData.categories || [];
    
    const totalItems = items.length;
    const availableItems = items.filter(item => item.available).length;
    const itemsWithImages = items.filter(item => item.image).length;
    const categoriesWithItems = categories.filter(cat => 
      items.some(item => item.category === cat.id)
    ).length;
    
    const averagePrice = items.length > 0 
      ? items.reduce((sum, item) => sum + item.price, 0) / items.length 
      : 0;
    
    const categoryStats = categories.map(category => ({
      ...category,
      itemCount: items.filter(item => item.category === category.id).length,
      availableCount: items.filter(item => item.category === category.id && item.available).length
    }));

    return {
      totalItems,
      availableItems,
      itemsWithImages,
      categoriesWithItems,
      averagePrice,
      categoryStats,
      completionPercentage: Math.min((totalItems / minimumItems) * 100, 100),
      meetsMinimum: totalItems >= minimumItems,
      hasImages: (itemsWithImages / Math.max(totalItems, 1)) >= 0.7, // 70% of items should have images
      hasVariety: categoriesWithItems >= 3 // At least 3 categories with items
    };
  }, [localData.menuItems, localData.categories, minimumItems]);

  // Category management
  const handleCategoryAdd = useCallback(async (categoryData: Omit<MenuCategory, 'id'>) => {
    const newCategory: MenuCategory = {
      ...categoryData,
      id: `category_${Date.now()}`,
    };
    
    const updatedCategories = [...(localData.categories || []), newCategory];
    handleDataChange({ categories: updatedCategories });
  }, [localData.categories, handleDataChange]);

  const handleCategoryUpdate = useCallback(async (id: string, updates: Partial<MenuCategory>) => {
    const updatedCategories = (localData.categories || []).map(cat =>
      cat.id === id ? { ...cat, ...updates } : cat
    );
    handleDataChange({ categories: updatedCategories });
  }, [localData.categories, handleDataChange]);

  const handleCategoryDelete = useCallback(async (id: string) => {
    const updatedCategories = (localData.categories || []).filter(cat => cat.id !== id);
    const updatedItems = (localData.menuItems || []).filter(item => item.category !== id);
    handleDataChange({ 
      categories: updatedCategories,
      menuItems: updatedItems
    });
  }, [localData.categories, localData.menuItems, handleDataChange]);

  const handleCategoryReorder = useCallback(async (reorderedCategories: MenuCategory[]) => {
    handleDataChange({ categories: reorderedCategories });
  }, [handleDataChange]);

  // Menu item management
  const handleMenuItemSave = useCallback(async (itemData: Omit<MenuItem, 'id'> | MenuItem) => {
    const items = localData.menuItems || [];
    
    if ('id' in itemData) {
      // Update existing item
      const updatedItems = items.map(item =>
        item.id === itemData.id ? itemData : item
      );
      handleDataChange({ menuItems: updatedItems });
    } else {
      // Create new item
      const newItem: MenuItem = {
        ...itemData,
        id: `item_${Date.now()}`,
        sortOrder: items.length
      };
      handleDataChange({ menuItems: [...items, newItem] });
    }
    
    setEditingItem(null);
    setIsCreatingItem(false);
  }, [localData.menuItems, handleDataChange]);

  const handleMenuItemUpdate = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    const updatedItems = (localData.menuItems || []).map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    handleDataChange({ menuItems: updatedItems });
  }, [localData.menuItems, handleDataChange]);

  const handleMenuItemReorder = useCallback(async (categoryId: string, reorderedItems: MenuItem[]) => {
    const otherItems = (localData.menuItems || []).filter(item => item.category !== categoryId);
    const updatedItems = [...otherItems, ...reorderedItems];
    handleDataChange({ menuItems: updatedItems });
  }, [localData.menuItems, handleDataChange]);

  const handleMenuItemDelete = useCallback((itemId: string) => {
    const updatedItems = (localData.menuItems || []).filter(item => item.id !== itemId);
    handleDataChange({ menuItems: updatedItems });
  }, [localData.menuItems, handleDataChange]);

  const handleCreateNewItem = useCallback(() => {
    setEditingItem(null);
    setIsCreatingItem(true);
  }, []);

  const handleEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setIsCreatingItem(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
    setIsCreatingItem(false);
  }, []);

  // Validation
  const validateMenu = useCallback((): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!menuStats.meetsMinimum) {
      issues.push(`Necesitas al menos ${minimumItems} platillos (tienes ${menuStats.totalItems})`);
    }
    
    if (!menuStats.hasVariety) {
      issues.push('Necesitas platillos en al menos 3 categorías diferentes');
    }
    
    if (!menuStats.hasImages) {
      issues.push('Al menos el 70% de tus platillos deben tener imagen');
    }
    
    if (menuStats.availableItems < Math.ceil(menuStats.totalItems * 0.8)) {
      issues.push('Al menos el 80% de tus platillos deben estar disponibles');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }, [menuStats, minimumItems]);

  const handleNext = useCallback(() => {
    const validation = validateMenu();
    if (validation.isValid) {
      handleDataChange({ isMenuComplete: true });
      onNext();
    }
  }, [validateMenu, handleDataChange, onNext]);

  const validation = validateMenu();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Creación del Menú
        </h2>
        <p className="text-gray-600">
          Crea tu menú completo para empezar a recibir pedidos
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <Badge variant={menuStats.meetsMinimum ? 'success' : 'warning'}>
            {menuStats.totalItems}/{minimumItems} platillos
          </Badge>
          <Badge variant={menuStats.hasVariety ? 'success' : 'secondary'}>
            {menuStats.categoriesWithItems} categorías activas
          </Badge>
          <Badge variant={menuStats.hasImages ? 'success' : 'secondary'}>
            {Math.round((menuStats.itemsWithImages / Math.max(menuStats.totalItems, 1)) * 100)}% con imagen
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Progreso del Menú
          </h3>
          <div className="text-sm text-gray-600">
            {Math.round(menuStats.completionPercentage)}% completado
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-[#e4007c] h-3 rounded-full transition-all duration-300"
            style={{ width: `${menuStats.completionPercentage}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{menuStats.totalItems}</div>
            <div className="text-sm text-gray-600">Platillos totales</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{menuStats.availableItems}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{menuStats.categoriesWithItems}</div>
            <div className="text-sm text-gray-600">Categorías activas</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${menuStats.averagePrice.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Precio promedio</div>
          </div>
        </div>
      </Card>

      {/* Requirements Checklist */}
      {!validation.isValid && (
        <Alert variant="warning">
          <div className="space-y-2">
            <p className="font-medium">Requisitos pendientes para completar tu menú:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validation.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {/* Tab Navigation */}
      <Card className="p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('builder')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'builder'
                  ? 'border-[#e4007c] text-[#e4007c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Constructor de Menú
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'preview'
                  ? 'border-[#e4007c] text-[#e4007c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Vista Previa
              <Badge variant="secondary" size="sm" className="ml-2">
                {menuStats.totalItems}
              </Badge>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'builder' ? (
          <div className="space-y-6">
            {(isCreatingItem || editingItem) ? (
              <MenuItemEditor
                item={editingItem || undefined}
                categories={localData.categories || []}
                onSave={handleMenuItemSave}
                onCancel={handleCancelEdit}
                onImageUpload={onImageUpload}
              />
            ) : (
              <>
                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      Gestión de Menú
                    </h4>
                    <p className="text-sm text-gray-600">
                      Organiza tu menú en categorías y agrega platillos
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                    >
                      <option value="">Todas las categorías</option>
                      {(localData.categories || []).map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={handleCreateNewItem}
                      className="px-4 py-2 bg-[#e4007c] text-white rounded-md hover:bg-[#c6006b] transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Agregar Platillo</span>
                    </button>
                  </div>
                </div>

                {/* Category Manager */}
                <CategoryManager
                  categories={localData.categories || []}
                  menuItems={localData.menuItems || []}
                  onCategoryAdd={handleCategoryAdd}
                  onCategoryUpdate={handleCategoryUpdate}
                  onCategoryDelete={handleCategoryDelete}
                  onCategoryReorder={handleCategoryReorder}
                  onMenuItemUpdate={handleMenuItemUpdate}
                  onMenuItemReorder={handleMenuItemReorder}
                  onMenuItemEdit={handleEditItem}
                  showMenuItems={true}
                />

                {/* Quick Start Guide */}
                {menuStats.totalItems === 0 && (
                  <Card className="p-6 bg-blue-50 border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">
                      🚀 Guía Rápida para Crear tu Menú
                    </h4>
                    <div className="space-y-3 text-sm text-blue-800">
                      <div className="flex items-start space-x-2">
                        <span className="font-medium">1.</span>
                        <span>Organiza tus platillos en categorías (Entradas, Platos Principales, Postres, etc.)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-medium">2.</span>
                        <span>Agrega al menos {minimumItems} platillos con descripciones detalladas</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-medium">3.</span>
                        <span>Sube fotos atractivas para el 70% de tus platillos</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-medium">4.</span>
                        <span>Configura precios competitivos y tiempos de preparación realistas</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="font-medium">5.</span>
                        <span>Marca como disponibles los platillos que puedes preparar hoy</span>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        ) : (
          /* Menu Preview */
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Vista Previa del Menú
              </h4>
              <p className="text-sm text-gray-600">
                Así verán tu menú los clientes en la aplicación
              </p>
            </div>

            {menuStats.totalItems > 0 ? (
              <div className="space-y-6">
                {menuStats.categoryStats
                  .filter(cat => cat.itemCount > 0)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(category => {
                    const categoryItems = (localData.menuItems || [])
                      .filter(item => item.category === category.id)
                      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                    return (
                      <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900">
                                {category.name}
                              </h5>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="info" size="sm">
                              {category.itemCount} platillo{category.itemCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {categoryItems.map(item => (
                              <div key={item.id} className="flex space-x-4">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <h6 className="font-medium text-gray-900 truncate">
                                      {item.name}
                                    </h6>
                                    <div className="ml-2 flex-shrink-0">
                                      <span className="text-lg font-bold text-[#e4007c]">
                                        ${item.price.toFixed(2)}
                                      </span>
                                      {!item.available && (
                                        <Badge variant="secondary" size="sm" className="ml-2">
                                          No disponible
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                    {item.preparationTime && (
                                      <span>⏱️ {item.preparationTime} min</span>
                                    )}
                                    {item.dietary && item.dietary.length > 0 && (
                                      <div className="flex space-x-1">
                                        {item.dietary.slice(0, 2).map(diet => (
                                          <span key={diet.id}>{diet.icon}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu menú está vacío
                </h3>
                <p className="text-gray-500 mb-4">
                  Agrega platillos para ver cómo se verá tu menú
                </p>
                <button
                  onClick={() => setActiveTab('builder')}
                  className="px-4 py-2 bg-[#e4007c] text-white rounded-md hover:bg-[#c6006b] transition-colors"
                >
                  Ir al Constructor
                </button>
              </div>
            )}
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
          disabled={isLoading || !validation.isValid}
          className="px-6 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          {isLoading ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}