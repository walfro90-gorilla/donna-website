'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import DeliveryProfileForm from '@/components/forms/DeliveryProfileForm';
import DeliveryDocumentsForm from '@/components/forms/DeliveryDocumentsForm';
import DashboardHome from '@/components/delivery/DashboardHome';

type Tab = 'home' | 'profile' | 'documents' | 'operations';

export default function DeliveryAgentDashboard() {
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [status, setStatus] = useState<string>('pending');
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (user && user.role !== 'delivery_agent') {
            router.push('/login');
            return;
        }

        if (user) {
            fetchProfileData();
        }
    }, [user, loading, router, mounted]);

    const fetchProfileData = async () => {
        const { data, error } = await supabase
            .from('delivery_agent_profiles')
            .select('*')
            .eq('user_id', user?.id)
            .single();

        if (data) {
            setStatus(data.status);
            setProfileData(data);
        }
    };

    const calculateCompletion = () => {
        if (!profileData) return 0;

        const profileFields = [
            'profile_image_url', 'vehicle_type', 'vehicle_plate',
            'vehicle_model', 'vehicle_color', 'vehicle_photo_url',
            'emergency_contact_name', 'emergency_contact_phone'
        ];

        const docFields = [
            'id_document_front_url', 'id_document_back_url',
            'vehicle_registration_url', 'vehicle_insurance_url'
        ];

        const totalFields = profileFields.length + docFields.length;
        let completedFields = 0;

        profileFields.forEach(field => {
            if (profileData[field]) completedFields++;
        });

        docFields.forEach(field => {
            if (profileData[field]) completedFields++;
        });

        return Math.round((completedFields / totalFields) * 100);
    };

    const isProfileComplete = () => {
        if (!profileData) return false;
        return !!(profileData.profile_image_url && profileData.vehicle_plate && profileData.vehicle_photo_url);
    };

    const areDocumentsComplete = () => {
        if (!profileData) return false;
        return !!(profileData.id_document_front_url && profileData.vehicle_registration_url);
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#e4007c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'delivery_agent') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard Repartidor
                            </h1>
                            {status === 'pending' && (
                                <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Verificación Pendiente
                                </span>
                            )}
                            {status === 'approved' && (
                                <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verificado
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-8 -mb-px overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'home'
                                ? 'border-[#e4007c] text-[#e4007c]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Resumen
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'profile'
                                ? 'border-[#e4007c] text-[#e4007c]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Mi Perfil y Vehículo
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'documents'
                                ? 'border-[#e4007c] text-[#e4007c]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Documentación
                        </button>
                        <button
                            onClick={() => setActiveTab('operations')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'operations'
                                ? 'border-[#e4007c] text-[#e4007c]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Operaciones
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'home' && (
                    <DashboardHome
                        agentName={user.name || user.email || ''}
                        checklistCompletion={calculateCompletion()}
                        checklistItems={[
                            {
                                id: 'profile',
                                label: 'Perfil y Vehículo',
                                description: 'Completa tu información personal y de tu vehículo',
                                isCompleted: isProfileComplete(),
                                action: () => setActiveTab('profile')
                            },
                            {
                                id: 'documents',
                                label: 'Documentación Legal',
                                description: 'Sube tu identificación y documentos del vehículo',
                                isCompleted: areDocumentsComplete(),
                                action: () => setActiveTab('documents')
                            },
                            {
                                id: 'training',
                                label: 'Capacitación (Opcional)',
                                description: 'Aprende cómo usar la app de repartidor',
                                isCompleted: false,
                                action: () => { }
                            }
                        ]}
                    />
                )}

                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        Mantén tu información y la de tu vehículo actualizada.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DeliveryProfileForm />
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Tus documentos deben estar vigentes para poder realizar entregas.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DeliveryDocumentsForm />
                    </div>
                )}

                {activeTab === 'operations' && (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Panel de Operaciones</h3>
                        <p className="mt-2 text-gray-500">
                            Esta funcionalidad estará disponible una vez que tu perfil sea aprobado.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
