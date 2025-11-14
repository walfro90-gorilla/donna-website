// components/menu/CategoryManager.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import { Card, Badge, Alert } from '@/components/ui';
import type { MenuCategory, MenuItem } from './MenuItemEditor';

export interface CategoryManagerProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onCategoryAdd: (category: Omit<MenuCategory, 'id'>) => Promise<void>;
  onCategoryUpdate: (id: string, updates: Partial<MenuCategory>) => Promise<void>;
  onCategoryDelete: (id: string) => Promise<void>;
  onCategoryReorder: (categories: MenuCategory[]) => Promise<void>;
  onMenuItemUpdate?: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  onMenuItemReorder?: (categoryId: string, items: MenuItem[]) => Promise<void>;
  onMenuItemEdit?: (item: MenuItem) => void;
  showMenuItems?: boolean;
  className?: string;
}

export default function CategoryManager({
  categories,
  menuItems,
  onCategoryAdd,
  onCategoryUpdate,
  onCategoryDelete,
  onCategoryReorder,
  onMenuItemUpdate,
  onMenuItemReorder,
  onMenuItemEdit,
  showMenuItems = true,
  className = ''
}: CategoryManagerProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [draggedMenuItem, setDraggedMenuItem] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const validateCategoryName = useCallback((name: string, excludeId?: string): string | null => {
    if (!name.trim()) {
      return 'El nombre de la categoría es requerido';
    }
    
    if (name.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (name.length > 50) {
      return 'El nombre no puede exceder 50 caracteres';
    }
    
    const exists = categories.some(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && cat.id !== excludeId
    );
    
    if (exists) {
      return 'Ya existe una categoría con este nombre';
    }
    
    return null;
  }, [categories]);

  const handleAddCategory = useCallback(async () => {
    const nameError = validateCategoryName(newCategoryName);
    if (nameError) {
      setErrors({ name: nameError });
      return;
    }

    setIsLoading(true);
    try {
      await onCategoryAdd({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        sortOrder: categories.length,
        isActive: true
      });
      
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsAddingCategory(false);
      setErrors({});
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Error al crear la categoría'
      });
    } finally {
      setIsLoading(false);
    }
  }, [newCategoryName, newCategoryDescription, categories.length, onCategoryAdd, validateCategoryName]);

  const handleUpdateCategory = useCallback(async (categoryId: string, name: string, description: string) => {
    const nameError = validateCategoryName(name, categoryId);
    if (nameError) {
      setErrors({ [`edit_${categoryId}`]: nameError });
      return;
    }

    setIsLoading(true);
    try {
      await onCategoryUpdate(categoryId, {
        name: name.trim(),
        description: description.trim() || undefined
      });
      
      setEditingCategory(null);
      setErrors({});
    } catch (error) {
      setErrors({
        [`edit_${categoryId}`]: error instanceof Error ? error.message : 'Error al actualizar la categoría'
      });
    } finally {
      setIsLoading(false);
    }
  }, [onCategoryUpdate, validateCategoryName]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    const itemsInCategory = menuItems.filter(item => item.category === categoryId);
    
    if (itemsInCategory.length > 0) {
      setErrors({
        [`delete_${categoryId}`]: `No se puede eliminar la categoría porque tiene ${itemsInCategory.length} platillo(s) asignado(s)`
      });
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    setIsLoading(true);
    try {
      await onCategoryDelete(categoryId);
      setErrors({});
    } catch (error) {
      setErrors({
        [`delete_${categoryId}`]: error instanceof Error ? error.message : 'Error al eliminar la categoría'
      });
    } finally {
      setIsLoading(false);
    }
  }, [menuItems, onCategoryDelete]);

  const handleToggleActive = useCallback(async (categoryId: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      await onCategoryUpdate(categoryId, { isActive });
    } catch (error) {
      setErrors({
        [`toggle_${categoryId}`]: error instanceof Error ? error.message : 'Error al actualizar el estado'
      });
    } finally {
      setIsLoading(false);
    }
  }, [onCategoryUpdate]);

  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedCategory || draggedCategory === targetCategoryId) {
      setDraggedCategory(null);
      return;
    }

    const draggedIndex = categories.findIndex(cat => cat.id === draggedCategory);
    const targetIndex = categories.findIndex(cat => cat.id === targetCategoryId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCategory(null);
      return;
    }

    const reorderedCategories = [...categories];
    const [draggedItem] = reorderedCategories.splice(draggedIndex, 1);
    reorderedCategories.splice(targetIndex, 0, draggedItem);

    // Update sort orders
    const updatedCategories = reorderedCategories.map((cat, index) => ({
      ...cat,
      sortOrder: index
    }));

    try {
      await onCategoryReorder(updatedCategories);
    } catch (error) {
      setErrors({
        reorder: error instanceof Error ? error.message : 'Error al reordenar categorías'
      });
    }
    
    setDraggedCategory(null);
  }, [draggedCategory, categories, onCategoryReorder]);

  const getCategoryItemCount = useCallback((categoryId: string): number => {
    return menuItems.filter(item => item.category === categoryId).length;
  }, [menuItems]);

  const getCategoryItems = useCallback((categoryId: string): MenuItem[] => {
    return menuItems
      .filter(item => item.category === categoryId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [menuItems]);

  const filteredCategories = useMemo(() => {
    const sorted = categories.sort((a, b) => a.sortOrder - b.sortOrder);
    if (filterCategory === 'all') return sorted;
    if (filterCategory === 'active') return sorted.filter(cat => cat.isActive);
    if (filterCategory === 'inactive') return sorted.filter(cat => !cat.isActive);
    return sorted.filter(cat => cat.id === filterCategory);
  }, [categories, filterCategory]);

  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleMenuItemAvailabilityToggle = useCallback(async (itemId: string, available: boolean) => {
    if (!onMenuItemUpdate) return;
    
    setIsLoading(true);
    try {
      await onMenuItemUpdate(itemId, { available });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [`item_${itemId}`]: error instanceof Error ? error.message : 'Error al actualizar disponibilidad'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [onMenuItemUpdate]);

  const handleMenuItemDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    setDraggedMenuItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleMenuItemDrop = useCallback(async (e: React.DragEvent, targetItemId: string, categoryId: string) => {
    e.preventDefault();
    
    if (!draggedMenuItem || !onMenuItemReorder || draggedMenuItem === targetItemId) {
      setDraggedMenuItem(null);
      return;
    }

    const categoryItems = getCategoryItems(categoryId);
    const draggedIndex = categoryItems.findIndex(item => item.id === draggedMenuItem);
    const targetIndex = categoryItems.findIndex(item => item.id === targetItemId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedMenuItem(null);
      return;
    }

    const reorderedItems = [...categoryItems];
    const [draggedItem] = reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(targetIndex, 0, draggedItem);

    // Update sort orders
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      sortOrder: index
    }));

    try {
      await onMenuItemReorder(categoryId, updatedItems);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        reorder_items: error instanceof Error ? error.message : 'Error al reordenar platillos'
      }));
    }
    
    setDraggedMenuItem(null);
  }, [draggedMenuItem, getCategoryItems, onMenuItemReorder]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Gestión de Categorías y Menú
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Organiza tu menú en categorías y gestiona la disponibilidad de platillos
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>{categories.length} categorías</span>
              <span>•</span>
              <span>{menuItems.length} platillos</span>
              <span>•</span>
              <span>{menuItems.filter(item => item.available).length} disponibles</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {showMenuItems && (
              <div className="flex items-center space-x-2">
                <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                  Filtrar:
                </label>
                <select
                  id="category-filter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="active">Solo activas</option>
                  <option value="inactive">Solo inactivas</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              onClick={() => setIsAddingCategory(true)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Agregar Categoría</span>
            </button>
          </div>
        </div>

        {errors.submit && (
          <Alert variant="error" className="mb-4">
            {errors.submit}
          </Alert>
        )}

        {errors.reorder && (
          <Alert variant="error" className="mb-4">
            {errors.reorder}
          </Alert>
        )}

        {/* Add Category Form */}
        {isAddingCategory && (
          <Card className="p-4 mb-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nueva Categoría
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`
                    w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]
                    ${errors.name ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Ej: Entradas, Platos Principales, Postres"
                  maxLength={50}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="new-category-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  id="new-category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                  placeholder="Descripción breve de la categoría"
                  maxLength={100}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddCategory}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creando...' : 'Crear Categoría'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                    setErrors({});
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Categories List */}
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay categorías
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primera categoría para organizar tu menú
              </p>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded-md hover:bg-[#c6006b]"
              >
                Crear Primera Categoría
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron categorías
              </h3>
              <p className="text-gray-500">
                Ajusta los filtros para ver más categorías
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <EnhancedCategoryItem
                key={category.id}
                category={category}
                items={getCategoryItems(category.id)}
                itemCount={getCategoryItemCount(category.id)}
                isExpanded={expandedCategories.has(category.id)}
                isEditing={editingCategory === category.id}
                error={errors[`edit_${category.id}`] || errors[`delete_${category.id}`] || errors[`toggle_${category.id}`]}
                isLoading={isLoading}
                showMenuItems={showMenuItems}
                onToggleExpansion={() => toggleCategoryExpansion(category.id)}
                onEdit={() => setEditingCategory(category.id)}
                onCancelEdit={() => {
                  setEditingCategory(null);
                  setErrors(prev => ({ ...prev, [`edit_${category.id}`]: '' }));
                }}
                onSave={(name: string, description: string) => handleUpdateCategory(category.id, name, description)}
                onDelete={() => handleDeleteCategory(category.id)}
                onToggleActive={(isActive: boolean) => handleToggleActive(category.id, isActive)}
                onDragStart={(e: React.DragEvent) => handleDragStart(e, category.id)}
                onDragOver={handleDragOver}
                onDrop={(e: React.DragEvent) => handleDrop(e, category.id)}
                isDragging={draggedCategory === category.id}
                onMenuItemEdit={onMenuItemEdit}
                onMenuItemAvailabilityToggle={handleMenuItemAvailabilityToggle}
                onMenuItemDragStart={handleMenuItemDragStart}
                onMenuItemDrop={handleMenuItemDrop}
                draggedMenuItem={draggedMenuItem}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

interface EnhancedCategoryItemProps {
  category: MenuCategory;
  items: MenuItem[];
  itemCount: number;
  isExpanded: boolean;
  isEditing: boolean;
  error?: string;
  isLoading: boolean;
  showMenuItems: boolean;
  onToggleExpansion: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (name: string, description: string) => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  onMenuItemEdit?: (item: MenuItem) => void;
  onMenuItemAvailabilityToggle: (itemId: string, available: boolean) => void;
  onMenuItemDragStart: (e: React.DragEvent, itemId: string) => void;
  onMenuItemDrop: (e: React.DragEvent, targetItemId: string, categoryId: string) => void;
  draggedMenuItem: string | null;
}

function EnhancedCategoryItem({
  category,
  items,
  itemCount,
  isExpanded,
  isEditing,
  error,
  isLoading,
  showMenuItems,
  onToggleExpansion,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onToggleActive,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  onMenuItemEdit,
  onMenuItemAvailabilityToggle,
  onMenuItemDragStart,
  onMenuItemDrop,
  draggedMenuItem
}: EnhancedCategoryItemProps) {
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description || '');

  const handleSave = useCallback(() => {
    onSave(editName, editDescription);
  }, [editName, editDescription, onSave]);

  const handleCancel = useCallback(() => {
    setEditName(category.name);
    setEditDescription(category.description || '');
    onCancelEdit();
  }, [category.name, category.description, onCancelEdit]);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const availableItemsCount = items.filter(item => item.available).length;

  return (
    <div
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        border rounded-lg transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${!isEditing ? 'cursor-move hover:shadow-md' : ''}
        ${category.isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'}
      `}
    >
      {/* Category Header */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                maxLength={100}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 py-1 text-sm font-medium text-white bg-[#e4007c] border border-transparent rounded hover:bg-[#c6006b] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {category.name}
                  </h3>
                  <Badge variant={category.isActive ? 'success' : 'secondary'} size="sm">
                    {category.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Badge variant="info" size="sm">
                    {itemCount} platillo{itemCount !== 1 ? 's' : ''}
                  </Badge>
                  {showMenuItems && itemCount > 0 && (
                    <Badge variant={availableItemsCount > 0 ? 'success' : 'warning'} size="sm">
                      {availableItemsCount} disponible{availableItemsCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {category.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {showMenuItems && itemCount > 0 && (
                <button
                  onClick={onToggleExpansion}
                  className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
                >
                  <span>{isExpanded ? 'Ocultar' : 'Ver'} platillos</span>
                  <svg 
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => onToggleActive(!category.isActive)}
                disabled={isLoading}
                className={`
                  px-2 py-1 text-xs font-medium rounded transition-colors
                  ${category.isActive
                    ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {category.isActive ? 'Desactivar' : 'Activar'}
              </button>
              
              <button
                onClick={onEdit}
                disabled={isLoading}
                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Editar
              </button>
              
              <button
                onClick={onDelete}
                disabled={isLoading || itemCount > 0}
                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={itemCount > 0 ? 'No se puede eliminar una categoría con platillos' : 'Eliminar categoría'}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}

        {error && !isEditing && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Menu Items Section */}
      {showMenuItems && isExpanded && itemCount > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Platillos en esta categoría
              </h4>
              <div className="text-xs text-gray-500">
                Arrastra para reordenar
              </div>
            </div>
            
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => onMenuItemDragStart(e, item.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => onMenuItemDrop(e, item.id, category.id)}
                  className={`
                    flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-sm transition-all duration-200
                    ${draggedMenuItem === item.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                  `}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h5>
                        <Badge variant={item.available ? 'success' : 'secondary'} size="sm">
                          {item.available ? 'Disponible' : 'No disponible'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-medium text-[#e4007c]">
                          {formatCurrency(item.price)}
                        </span>
                        {item.preparationTime && (
                          <span className="text-xs text-gray-500">
                            • {item.preparationTime} min
                          </span>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => onMenuItemAvailabilityToggle(item.id, !item.available)}
                      disabled={isLoading}
                      className={`
                        px-2 py-1 text-xs font-medium rounded transition-colors
                        ${item.available
                          ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {item.available ? 'Ocultar' : 'Mostrar'}
                    </button>
                    
                    {onMenuItemEdit && (
                      <button
                        onClick={() => onMenuItemEdit(item)}
                        disabled={isLoading}
                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {items.length === 0 && (
              <div className="text-center py-6">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm text-gray-500">
                  No hay platillos en esta categoría
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}