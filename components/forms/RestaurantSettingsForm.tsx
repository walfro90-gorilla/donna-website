'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Button, LoadingSpinner, Alert } from '@/components/ui';

interface BusinessHours {
    [key: string]: { open: string; close: string; closed: boolean };
}

interface RestaurantSettingsData {
    delivery_radius_km: number;
    min_order_amount: number;
    estimated_delivery_time_minutes: number;
    business_hours: BusinessHours;
}

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

const DEFAULT_HOURS = { open: '09:00', close: '22:00', closed: false };

export default function RestaurantSettingsForm() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState<RestaurantSettingsData>({
        delivery_radius_km: 5,
        min_order_amount: 0,
        estimated_delivery_time_minutes: 30,
        business_hours: DAYS.reduce((acc, day) => ({ ...acc, [day.key]: { ...DEFAULT_HOURS } }), {}),
    });

    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('restaurants')
                .select('delivery_radius_km, min_order_amount, estimated_delivery_time_minutes, business_hours')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setFormData({
                    delivery_radius_km: data.delivery_radius_km || 5,
                    min_order_amount: data.min_order_amount || 0,
                    estimated_delivery_time_minutes: data.estimated_delivery_time_minutes || 30,
                    business_hours: (data.business_hours as BusinessHours) || formData.business_hours,
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    const handleHoursChange = (dayKey: string, field: 'open' | 'close' | 'closed', value: any) => {
        setFormData(prev => ({
            ...prev,
            business_hours: {
                ...prev.business_hours,
                [dayKey]: {
                    ...prev.business_hours[dayKey],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user?.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Configuración actualizada correctamente.' });

        } catch (error: any) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: error.message || 'Error al guardar la configuración.' });
        } finally {
            setIsSaving(false);
        }
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

            {/* General Settings */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-lg font-medium leading-6 text-gray-900">Configuración General</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Define tus zonas de entrega y condiciones de pedido.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                    {/* Delivery Radius */}
                    <div>
                        <label htmlFor="delivery_radius_km" className="block text-sm font-medium text-gray-700">
                            Radio de Entrega (km)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="delivery_radius_km"
                                id="delivery_radius_km"
                                min="0"
                                step="0.1"
                                value={formData.delivery_radius_km}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                        </div>
                    </div>

                    {/* Min Order Amount */}
                    <div>
                        <label htmlFor="min_order_amount" className="block text-sm font-medium text-gray-700">
                            Pedido Mínimo ($)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="min_order_amount"
                                id="min_order_amount"
                                min="0"
                                step="1"
                                value={formData.min_order_amount}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                        </div>
                    </div>

                    {/* Estimated Time */}
                    <div>
                        <label htmlFor="estimated_delivery_time_minutes" className="block text-sm font-medium text-gray-700">
                            Tiempo Estimado (min)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="estimated_delivery_time_minutes"
                                id="estimated_delivery_time_minutes"
                                min="0"
                                step="5"
                                value={formData.estimated_delivery_time_minutes}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Horarios de Atención</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Configura los días y horas que tu negocio está abierto.
                    </p>
                </div>
                <div className="space-y-4">
                    {DAYS.map((day) => (
                        <div key={day.key} className="flex items-center space-x-4">
                            <div className="w-24 font-medium text-gray-700">{day.label}</div>
                            <div className="flex items-center space-x-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={!formData.business_hours[day.key]?.closed}
                                        onChange={(e) => handleHoursChange(day.key, 'closed', !e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-[#e4007c] border-gray-300 rounded focus:ring-[#e4007c]"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Abierto</span>
                                </label>
                            </div>

                            {!formData.business_hours[day.key]?.closed && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="time"
                                        value={formData.business_hours[day.key]?.open}
                                        onChange={(e) => handleHoursChange(day.key, 'open', e.target.value)}
                                        className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-32 sm:text-sm border-gray-300 rounded-md p-1 border"
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input
                                        type="time"
                                        value={formData.business_hours[day.key]?.close}
                                        onChange={(e) => handleHoursChange(day.key, 'close', e.target.value)}
                                        className="shadow-sm focus:ring-[#e4007c] focus:border-[#e4007c] block w-32 sm:text-sm border-gray-300 rounded-md p-1 border"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={isSaving}
                    className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#e4007c] hover:bg-[#c0006a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e4007c]"
                >
                    Guardar Configuración
                </Button>
            </div>
        </form>
    );
}
