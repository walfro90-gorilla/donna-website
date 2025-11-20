'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ImageUpload, Button, LoadingSpinner, Alert } from '@/components/ui';

interface Product {
    id?: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_available: boolean;
    type: 'principal' | 'bebida' | 'complemento' | 'postre';
}

interface ProductEditorProps {
    restaurantId: string;
    product?: Product;
    onSave: () => void;
    onCancel: () => void;
}

export default function ProductEditor({ restaurantId, product, onSave, onCancel }: ProductEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState<Product>({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || 0,
        image_url: product?.image_url || '',
        is_available: product?.is_available ?? true,
        type: product?.type || 'principal',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSaving(true);

        try {
            if (product?.id) {
                // Update existing product
                const { error } = await supabase
                    .from('products')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', product.id);

                if (error) throw error;
            } else {
                // Create new product
                const { error } = await supabase
                    .from('products')
                    .insert({
                        restaurant_id: restaurantId,
                        ...formData,
                    });

                if (error) throw error;
            }

            onSave();
        } catch (error: any) {
            console.error('Error saving product:', error);
            setMessage({ type: 'error', text: error.message || 'Error al guardar el producto.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900">
                    {product?.id ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-500"
                >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                {/* Image Upload */}
                <div className="sm:col-span-6 flex justify-center">
                    <div className="w-full sm:w-auto">
                        <ImageUpload
                            bucket="restaurant-images"
                            folderPath={`${restaurantId}/products`}
                            label="Foto del Platillo"
                            defaultImage={formData.image_url}
                            onUploadComplete={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                        />
                    </div>
                </div>

                {/* Basic Info */}
                <div className="sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nombre del Platillo
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Precio
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            name="price"
                            id="price"
                            required
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="focus:ring-[#e4007c] focus:border-[#e4007c] block w-full pl-7 sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>

                <div className="sm:col-span-3">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Categoría
                    </label>
                    <div className="mt-1">
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        >
                            <option value="principal">Platillo Principal</option>
                            <option value="bebida">Bebida</option>
                            <option value="complemento">Complemento</option>
                            <option value="postre">Postre</option>
                        </select>
                    </div>
                </div>

                <div className="sm:col-span-3 flex items-center pt-6">
                    <div className="flex items-center h-5">
                        <input
                            id="is_available"
                            name="is_available"
                            type="checkbox"
                            checked={formData.is_available}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                            className="focus:ring-[#e4007c] h-4 w-4 text-[#e4007c] border-gray-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="is_available" className="font-medium text-gray-700">
                            Disponible
                        </label>
                        <p className="text-gray-500">Marcar si el producto está disponible para ordenar.</p>
                    </div>
                </div>

            </div>

            <div className="pt-5 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={isSaving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#e4007c] hover:bg-[#c0006a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c]"
                >
                    Guardar Producto
                </Button>
            </div>
        </form>
    );
}
