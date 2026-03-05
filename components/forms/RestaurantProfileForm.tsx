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
        <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Alert>
            )}

            {/* Basic Info Section */}
            <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-6">
                <div className="border-b border-gray-700 pb-4 mb-6">
                    <h3 className="text-lg font-medium leading-6 text-white">Información Básica</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Detalles generales de tu restaurante.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
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
                                className="block w-full sm:text-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="cuisine_type" className="block text-sm font-medium text-gray-300">
                            Tipo de Cocina
                        </label>
                        <div className="mt-1">
                            <select
                                id="cuisine_type"
                                name="cuisine_type"
                                required
                                value={formData.cuisine_type}
                                onChange={handleInputChange}
                                className="block w-full sm:text-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
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

                    <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                            Descripción
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="block w-full sm:text-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                                placeholder="Describe tu restaurante, especialidades, etc."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact & Location Section */}
            <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-6">
                <div className="border-b border-gray-700 pb-4 mb-6">
                    <h3 className="text-lg font-medium leading-6 text-white">Contacto y Ubicación</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        ¿Dónde pueden encontrarte tus clientes?
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                            Teléfono de Contacto
                        </label>
                        <div className="mt-1">
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="block w-full sm:text-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                            Dirección
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <AddressAutocompleteRestaurant
                                value={formData.address}
                                onChange={handleAddressChange}
                                className="block w-full sm:text-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#e4007c] focus:border-[#e4007c]"
                                placeholder="Busca tu dirección..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Images Section */}
            <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-6">
                <div className="border-b border-gray-700 pb-4 mb-6">
                    <h3 className="text-lg font-medium leading-6 text-white">Imágenes del Negocio</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Las fotos atractivas aumentan tus ventas.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                        <ImageUpload
                            bucket="restaurant-images"
                            folderPath={`${user?.id}/logo`}
                            label="Logo del Restaurante"
                            defaultImage={formData.logo_url}
                            onUploadComplete={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                        />
                    </div>
                    <div>
                        <ImageUpload
                            bucket="restaurant-images"
                            folderPath={`${user?.id}/cover`}
                            label="Imagen de Portada"
                            defaultImage={formData.cover_image_url}
                            onUploadComplete={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
                        />
                    </div>
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

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={isSaving}
                    className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#e4007c] hover:bg-[#c0006a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c]"
                >
                    Guardar Cambios
                </Button>
            </div>
        </form>
    );
}
