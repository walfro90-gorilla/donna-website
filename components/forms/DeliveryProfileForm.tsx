'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { ImageUpload, Button, LoadingSpinner, Alert } from '@/components/ui';

interface DeliveryProfileData {
    profile_image_url: string;
    vehicle_type: string;
    vehicle_plate: string;
    vehicle_model: string;
    vehicle_color: string;
    vehicle_photo_url: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
}

export default function DeliveryProfileForm() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState<DeliveryProfileData>({
        profile_image_url: '',
        vehicle_type: 'motocicleta',
        vehicle_plate: '',
        vehicle_model: '',
        vehicle_color: '',
        vehicle_photo_url: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
    });

    useEffect(() => {
        if (user) {
            loadProfileData();
        }
    }, [user]);

    const loadProfileData = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('delivery_agent_profiles')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setFormData({
                    profile_image_url: data.profile_image_url || '',
                    vehicle_type: data.vehicle_type || 'motocicleta',
                    vehicle_plate: data.vehicle_plate || '',
                    vehicle_model: data.vehicle_model || '',
                    vehicle_color: data.vehicle_color || '',
                    vehicle_photo_url: data.vehicle_photo_url || '',
                    emergency_contact_name: data.emergency_contact_name || '',
                    emergency_contact_phone: data.emergency_contact_phone || '',
                });
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            setMessage({ type: 'error', text: 'Error al cargar los datos del perfil.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSaving(true);

        try {
            // Check if profile exists
            const { data: existing } = await supabase
                .from('delivery_agent_profiles')
                .select('user_id')
                .eq('user_id', user?.id)
                .single();

            let error;

            if (existing) {
                // Update
                const { error: updateError } = await supabase
                    .from('delivery_agent_profiles')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user?.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('delivery_agent_profiles')
                    .insert({
                        user_id: user?.id,
                        ...formData,
                        status: 'pending',
                    });
                error = insertError;
            }

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });

        } catch (error: any) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: error.message || 'Error al guardar el perfil.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900">Información Personal y Vehículo</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Completa tus datos para comenzar a recibir pedidos.
                </p>
            </div>

            {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                {/* Profile Image */}
                <div className="sm:col-span-6 flex justify-center sm:justify-start">
                    <div className="w-full sm:w-auto">
                        <ImageUpload
                            bucket="profile-images"
                            folderPath={`${user?.id}/avatar`}
                            label="Foto de Perfil"
                            defaultImage={formData.profile_image_url}
                            onUploadComplete={(url) => setFormData(prev => ({ ...prev, profile_image_url: url }))}
                            className="mx-auto sm:mx-0"
                        />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="sm:col-span-6 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto de Emergencia</h3>
                </div>

                <div className="sm:col-span-3">
                    <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                        Nombre Completo
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="emergency_contact_name"
                            id="emergency_contact_name"
                            required
                            value={formData.emergency_contact_name}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                <div className="sm:col-span-3">
                    <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                        Teléfono
                    </label>
                    <div className="mt-1">
                        <input
                            type="tel"
                            name="emergency_contact_phone"
                            id="emergency_contact_phone"
                            required
                            value={formData.emergency_contact_phone}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Vehicle Info */}
                <div className="sm:col-span-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Vehículo</h3>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="vehicle_type" className="block text-sm font-medium text-gray-700">
                        Tipo de Vehículo
                    </label>
                    <div className="mt-1">
                        <select
                            id="vehicle_type"
                            name="vehicle_type"
                            required
                            value={formData.vehicle_type}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        >
                            <option value="motocicleta">Motocicleta</option>
                            <option value="bicicleta">Bicicleta</option>
                            <option value="auto">Automóvil</option>
                            <option value="pie">A pie</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="vehicle_plate" className="block text-sm font-medium text-gray-700">
                        Placa / Matrícula
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="vehicle_plate"
                            id="vehicle_plate"
                            value={formData.vehicle_plate}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="vehicle_color" className="block text-sm font-medium text-gray-700">
                        Color
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="vehicle_color"
                            id="vehicle_color"
                            value={formData.vehicle_color}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                <div className="sm:col-span-3">
                    <label htmlFor="vehicle_model" className="block text-sm font-medium text-gray-700">
                        Modelo / Marca
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="vehicle_model"
                            id="vehicle_model"
                            value={formData.vehicle_model}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Vehicle Photo */}
                <div className="sm:col-span-6 pt-4">
                    <ImageUpload
                        bucket="vehicle-images"
                        folderPath={`${user?.id}/vehicle`}
                        label="Foto del Vehículo"
                        defaultImage={formData.vehicle_photo_url}
                        onUploadComplete={(url) => setFormData(prev => ({ ...prev, vehicle_photo_url: url }))}
                    />
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
