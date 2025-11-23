'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { DocumentUpload, Button, LoadingSpinner, Alert } from '@/components/ui';

interface RestaurantDocumentsData {
    business_permit_url: string;
    health_permit_url: string;
}

export default function RestaurantDocumentsForm() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState<RestaurantDocumentsData>({
        business_permit_url: '',
        health_permit_url: '',
    });

    useEffect(() => {
        if (user) {
            loadDocuments();
        }
    }, [user]);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('restaurants')
                .select('business_permit_url, health_permit_url')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setFormData({
                    business_permit_url: data.business_permit_url || '',
                    health_permit_url: data.health_permit_url || '',
                });
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            setMessage({ type: 'error', text: 'Error al cargar los documentos.' });
        } finally {
            setIsLoading(false);
        }
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

            setMessage({ type: 'success', text: 'Documentos actualizados correctamente.' });

            // Update completion percentage
            await updateCompletionPercentage();

        } catch (error: any) {
            console.error('Error saving documents:', error);
            setMessage({ type: 'error', text: error.message || 'Error al guardar los documentos.' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateCompletionPercentage = async () => {
        // This logic should ideally be centralized or more robust
        // For now, we just trigger an update on the backend or re-calculate
        // Since we don't have the full context here, we'll skip complex calculation
        // and rely on the user filling out the forms.
        // In a real app, a database trigger or a dedicated service method would handle this.
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

            <div className="bg-white shadow rounded-lg p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-lg font-medium leading-6 text-gray-900">Documentación Legal</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Sube los documentos requeridos para verificar tu negocio.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    {/* Business Permit */}
                    <div>
                        <DocumentUpload
                            folderPath={`${user?.id}/permits`}
                            label="Permiso de Funcionamiento"
                            onUploadComplete={(path) => setFormData(prev => ({ ...prev, business_permit_url: path }))}
                        />
                        {formData.business_permit_url && (
                            <p className="mt-2 text-sm text-green-600">
                                ✓ Documento subido: {formData.business_permit_url.split('/').pop()}
                            </p>
                        )}
                    </div>

                    {/* Health Permit */}
                    <div>
                        <DocumentUpload
                            folderPath={`${user?.id}/permits`}
                            label="Permiso de Salubridad"
                            onUploadComplete={(path) => setFormData(prev => ({ ...prev, health_permit_url: path }))}
                        />
                        {formData.health_permit_url && (
                            <p className="mt-2 text-sm text-green-600">
                                ✓ Documento subido: {formData.health_permit_url.split('/').pop()}
                            </p>
                        )}
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
                    Guardar Documentos
                </Button>
            </div>
        </form>
    );
}
