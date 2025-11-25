
import { Database } from '@/lib/supabase/types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type DeliveryAgentProfile = Database['public']['Tables']['delivery_agent_profiles']['Row'];

export interface OnboardingStatus {
    percentage: number;
    missingFields: {
        key: string;
        label: string;
        href?: string;
    }[];
    isComplete: boolean;
}

export function calculateRestaurantProgress(restaurant: Restaurant | null): OnboardingStatus {
    if (!restaurant) {
        return { percentage: 0, missingFields: [], isComplete: false };
    }

    const fields = [
        { key: 'name', label: 'Nombre del Restaurante', required: true },
        { key: 'description', label: 'Descripción', required: true },
        { key: 'address', label: 'Dirección', required: true },
        { key: 'phone', label: 'Teléfono', required: true },
        { key: 'logo_url', label: 'Logo', required: true },
        { key: 'cover_image_url', label: 'Imagen de Portada', required: true },
        { key: 'cuisine_type', label: 'Tipo de Cocina', required: true },
        { key: 'business_hours', label: 'Horario de Atención', required: true },
        // Optional or advanced fields can be weighted differently or excluded from "100%" if strictly MVP
        { key: 'business_permit_url', label: 'Permiso de Funcionamiento', required: false },
        { key: 'health_permit_url', label: 'Permiso de Salud', required: false },
    ];

    let completedCount = 0;
    const missingFields = [];

    // We'll count only required fields for the percentage to avoid blocking 100% on optional stuff,
    // OR we include everything. Let's include everything that is "important" for a good profile.
    // Let's stick to the list above as "Core Profile".

    const totalWeight = fields.length;

    for (const field of fields) {
        const value = restaurant[field.key as keyof Restaurant];
        const isFilled = value !== null && value !== '' && value !== undefined;

        if (isFilled) {
            completedCount++;
        } else {
            missingFields.push({
                key: field.key,
                label: field.label,
                href: '/restaurant/settings' // Assuming a settings page exists
            });
        }
    }

    const percentage = Math.round((completedCount / totalWeight) * 100);

    return {
        percentage,
        missingFields,
        isComplete: percentage === 100
    };
}

export function calculateDeliveryAgentProgress(profile: DeliveryAgentProfile | null): OnboardingStatus {
    if (!profile) {
        return { percentage: 0, missingFields: [], isComplete: false };
    }

    const fields = [
        { key: 'vehicle_type', label: 'Tipo de Vehículo', required: true },
        { key: 'vehicle_plate', label: 'Placa del Vehículo', required: true },
        { key: 'vehicle_model', label: 'Modelo del Vehículo', required: true },
        { key: 'vehicle_color', label: 'Color del Vehículo', required: true },
        { key: 'profile_image_url', label: 'Foto de Perfil', required: true },
        { key: 'id_document_front_url', label: 'Documento de Identidad (Frente)', required: true },
        { key: 'id_document_back_url', label: 'Documento de Identidad (Dorso)', required: true },
        { key: 'vehicle_registration_url', label: 'Tarjeta de Circulación', required: true },
        { key: 'vehicle_insurance_url', label: 'Seguro del Vehículo', required: true },
        { key: 'emergency_contact_name', label: 'Contacto de Emergencia', required: true },
        { key: 'emergency_contact_phone', label: 'Teléfono de Emergencia', required: true },
    ];

    let completedCount = 0;
    const missingFields = [];
    const totalWeight = fields.length;

    for (const field of fields) {
        const value = profile[field.key as keyof DeliveryAgentProfile];
        const isFilled = value !== null && value !== '' && value !== undefined;

        if (isFilled) {
            completedCount++;
        } else {
            missingFields.push({
                key: field.key,
                label: field.label,
                href: '/delivery_agent/profile' // Assuming a profile page exists
            });
        }
    }

    const percentage = Math.round((completedCount / totalWeight) * 100);

    return {
        percentage,
        missingFields,
        isComplete: percentage === 100
    };
}
