'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { ImageUpload, Button, LoadingSpinner, Alert } from '@/components/ui';
import AddressAutocompleteRestaurant from '@/components/AddressAutocompleteRestaurant';

interface RestaurantProfileData {
    name: string;
    description: string;
    cuisine_type: string;
    phone: string;
    address: string;
    logo_url: string;
    cover_image_url: string;
    facade_image_url: string;
    location_lat?: number;
    location_lon?: number;
    location_place_id?: string;
    address_structured?: any;
}

export default function RestaurantProfileForm() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState<RestaurantProfileData>({
        name: '',
        description: '',
        cuisine_type: '',
        phone: '',
        address: '',
        logo_url: '',
        cover_image_url: '',
        facade_image_url: '',
    });

    useEffect(() => {
        console.log('RestaurantProfileForm: Mounted');
        if (user) {
            console.log('RestaurantProfileForm: User present, loading data');
            loadRestaurantData();
        } else {
            console.log('RestaurantProfileForm: No user found');
        }
    }, [user]);

    const loadRestaurantData = async () => {
        try {
            console.log('RestaurantProfileForm: loadRestaurantData started');
            setIsLoading(true);
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('RestaurantProfileForm: Error loading data', error);
                throw error;
            }

            if (data) {
                console.log('RestaurantProfileForm: Data loaded successfully', data);
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    cuisine_type: data.cuisine_type || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    logo_url: data.logo_url || '',
                    cover_image_url: data.cover_image_url || '',
                    facade_image_url: data.facade_image_url || '',
                    location_lat: data.location_lat,
                    location_lon: data.location_lon,
                    location_place_id: data.location_place_id,
                    address_structured: data.address_structured,
                });
            } else {
                console.log('RestaurantProfileForm: No data returned');
            }
        } catch (error) {
            console.error('Error loading restaurant data:', error);
            setMessage({ type: 'error', text: 'Error al cargar los datos del restaurante.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (address: string, placeData?: any) => {
        setFormData(prev => ({
            ...prev,
            address,
            location_lat: placeData?.coordinates?.lat,
            location_lon: placeData?.coordinates?.lng,
            location_place_id: placeData?.placeId,
            address_structured: placeData?.structuredAddress || placeData?.address_components
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSaving(true);

        try {
            // Check if restaurant exists
            const { data: existing } = await supabase
                .from('restaurants')
                .select('id')
                .eq('user_id', user?.id)
                .single();

            let error;

            if (existing) {
                // Update
                const { error: updateError } = await supabase
                    .from('restaurants')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user?.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('restaurants')
                    .insert({
                        user_id: user?.id,
                        ...formData,
                        status: 'pending', // Default status
                    });
                error = insertError;
            }

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });

            // Update profile completion percentage (simple logic for now)
            await updateCompletionPercentage();

        } catch (error: any) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: error.message || 'Error al guardar el perfil.' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateCompletionPercentage = async () => {
        // Calculate percentage based on filled fields
        const fields = ['name', 'description', 'cuisine_type', 'phone', 'address', 'logo_url', 'cover_image_url'];
        const filled = fields.filter(field => !!formData[field as keyof RestaurantProfileData]).length;
        const percentage = Math.round((filled / fields.length) * 100);

        await supabase
            .from('restaurants')
            .update({ profile_completion_percentage: percentage })
            .eq('user_id', user?.id);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner isLoading={true} /></div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900">Información Básica</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Esta información será visible para los clientes en la app.
                </p>
            </div>

            {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Name */}
                <div className="sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nombre del Restaurante
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

                {/* Cuisine Type */}
                <div className="sm:col-span-2">
                    <label htmlFor="cuisine_type" className="block text-sm font-medium text-gray-700">
                        Tipo de Cocina
                    </label>
                    <div className="mt-1">
                        <select
                            id="cuisine_type"
                            name="cuisine_type"
                            required
                            value={formData.cuisine_type}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        >
                            <option value="">Selecciona...</option>
                            <option value="mexicana">Mexicana</option>
                            <option value="italiana">Italiana</option>
                            <option value="japonesa">Japonesa</option>
                            <option value="hamburguesas">Hamburguesas</option>
                            <option value="pizza">Pizza</option>
                            <option value="cafe">Cafetería</option>
                            <option value="postres">Postres</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>

                {/* Description */}
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
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            placeholder="Describe tu restaurante, especialidades, etc."
                        />
                    </div>
                </div>

                {/* Phone */}
                <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Teléfono de Contacto
                    </label>
                    <div className="mt-1">
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Dirección
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <AddressAutocompleteRestaurant
                            value={formData.address}
                            onChange={handleAddressChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            placeholder="Busca tu dirección..."
                        />
                    </div>
                </div>

                {/* Images Section */}
                <div className="sm:col-span-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Imágenes</h3>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {/* Logo */}
                        <div>
                            <ImageUpload
                                bucket="restaurant-images"
                                folderPath={`${user?.id}/logo`}
                                label="Logo del Restaurante"
                                defaultImage={formData.logo_url}
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                            />
                        </div>

                        {/* Cover Image */}
                        <div>
                            <ImageUpload
                                bucket="restaurant-images"
                                folderPath={`${user?.id}/cover`}
                                label="Imagen de Portada"
                                defaultImage={formData.cover_image_url}
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
                            />
                        </div>

                        {/* Facade Image */}
                        <div>
                            <ImageUpload
                                bucket="restaurant-images"
                                folderPath={`${user?.id}/facade`}
                                label="Foto de la Fachada"
                                defaultImage={formData.facade_image_url}
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, facade_image_url: url }))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-5 border-t border-gray-200">
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        isLoading={isSaving}
                        disabled={isSaving}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#e4007c] hover:bg-[#c0006a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c]"
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </div>
        </form>
    );
}
