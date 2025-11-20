'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button, LoadingSpinner, Alert } from '@/components/ui';
import ProductEditor from './ProductEditor';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_available: boolean;
    type: 'principal' | 'bebida' | 'complemento' | 'postre';
}

interface ProductListProps {
    restaurantId: string;
}

export default function ProductList({ restaurantId }: ProductListProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | undefined>(undefined);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        console.log('ProductList: Mounted', { restaurantId });
        if (restaurantId) {
            loadProducts();
        } else {
            console.log('ProductList: No restaurantId provided');
        }
    }, [restaurantId]);

    const loadProducts = async () => {
        try {
            console.log('ProductList: loadProducts started');
            setIsLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('ProductList: Error loading products', error);
                throw error;
            }

            console.log('ProductList: Products loaded', data?.length);
            setProducts(data || []);
        } catch (error) {
            console.error('Error loading products:', error);
            setMessage({ type: 'error', text: 'Error al cargar el menú.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setCurrentProduct(product);
        setIsEditing(true);
        setMessage(null);
    };

    const handleAddNew = () => {
        setCurrentProduct(undefined);
        setIsEditing(true);
        setMessage(null);
    };

    const handleSave = () => {
        setIsEditing(false);
        setCurrentProduct(undefined);
        loadProducts();
        setMessage({ type: 'success', text: 'Producto guardado correctamente.' });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentProduct(undefined);
        setMessage(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProducts(prev => prev.filter(p => p.id !== id));
            setMessage({ type: 'success', text: 'Producto eliminado correctamente.' });
        } catch (error) {
            console.error('Error deleting product:', error);
            setMessage({ type: 'error', text: 'Error al eliminar el producto.' });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner isLoading={true} /></div>;
    }

    if (isEditing) {
        return (
            <ProductEditor
                restaurantId={restaurantId}
                product={currentProduct}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Menú Digital</h2>
                <Button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#e4007c] hover:bg-[#c0006a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c]"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Agregar Producto
                </Button>
            </div>

            {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Alert>
            )}

            {products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza agregando platillos a tu menú.</p>
                    <div className="mt-6">
                        <Button onClick={handleAddNew}>
                            Crear primer producto
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {products.map((product) => (
                            <li key={product.id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center flex-1 min-w-0">
                                        <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                                            {product.image_url ? (
                                                <img className="h-full w-full object-cover" src={product.image_url} alt={product.name} />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-[#e4007c] truncate">{product.name}</p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {product.is_available ? 'Disponible' : 'Agotado'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        ${product.price.toFixed(2)}
                                                    </p>
                                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                        {product.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Editar</span>
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-red-400 hover:text-red-500"
                                        >
                                            <span className="sr-only">Eliminar</span>
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
