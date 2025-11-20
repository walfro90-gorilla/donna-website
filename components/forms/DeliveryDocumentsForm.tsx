'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { DocumentUpload, Button, LoadingSpinner, Alert } from '@/components/ui';

interface DeliveryDocumentsData {
    id_document_front_url: string;
    id_document_back_url: string;
    vehicle_registration_url: string;
    vehicle_insurance_url: string;
}

export default function DeliveryDocumentsForm() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState<DeliveryDocumentsData>({
        id_document_front_url: '',
        id_document_back_url: '',
        vehicle_registration_url: '',
        vehicle_insurance_url: '',
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
                .from('delivery_agent_profiles')
                .select('id_document_front_url, id_document_back_url, vehicle_registration_url, vehicle_insurance_url')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setFormData({
                    id_document_front_url: data.id_document_front_url || '',
                    id_document_back_url: data.id_document_back_url || '',
                    vehicle_registration_url: data.vehicle_registration_url || '',
                    vehicle_insurance_url: data.vehicle_insurance_url || '',
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
                .from('delivery_agent_profiles')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user?.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Documentos actualizados correctamente.' });

        } catch (error: any) {
            console.error('Error saving documents:', error);
            setMessage({ type: 'error', text: error.message || 'Error al guardar los documentos.' });
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
                <h2 className="text-xl font-semibold text-gray-900">Documentación Requerida</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Sube fotos claras de tus documentos para verificar tu identidad y vehículo.
                </p>
            </div>

            {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">

                {/* ID Documents */}
                <div className="sm:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Identificación Oficial (INE/Pasaporte)</h3>
                </div>

                <div>
                    <DocumentUpload
                        folderPath={`${user?.id}/identity`}
                        label="Frente de la Identificación"
                        onUploadComplete={(path) => setFormData(prev => ({ ...prev, id_document_front_url: path }))}
                    />
                    {formData.id_document_front_url && (
                        <p className="mt-2 text-sm text-green-600">
                            ✓ Documento subido
                        </p>
                    )}
                </div>

                <div>
                    <DocumentUpload
                        folderPath={`${user?.id}/identity`}
                        label="Reverso de la Identificación"
                        onUploadComplete={(path) => setFormData(prev => ({ ...prev, id_document_back_url: path }))}
                    />
                    {formData.id_document_back_url && (
                        <p className="mt-2 text-sm text-green-600">
                            ✓ Documento subido
                        </p>
                    )}
                </div>

                {/* Vehicle Documents */}
                <div className="sm:col-span-2 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos del Vehículo</h3>
                </div>

                <div>
                    <DocumentUpload
                        folderPath={`${user?.id}/vehicle_docs`}
                        label="Tarjeta de Circulación"
                        onUploadComplete={(path) => setFormData(prev => ({ ...prev, vehicle_registration_url: path }))}
                    />
                    {formData.vehicle_registration_url && (
                        <p className="mt-2 text-sm text-green-600">
                            ✓ Documento subido
                        </p>
                    )}
                </div>

                <div>
                    <DocumentUpload
                        folderPath={`${user?.id}/vehicle_docs`}
                        label="Póliza de Seguro"
                        onUploadComplete={(path) => setFormData(prev => ({ ...prev, vehicle_insurance_url: path }))}
                    />
                    {formData.vehicle_insurance_url && (
                        <p className="mt-2 text-sm text-green-600">
                            ✓ Documento subido
                        </p>
                    )}
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
                        Guardar Documentos
                    </Button>
                </div>
            </div>
        </form>
    );
}
