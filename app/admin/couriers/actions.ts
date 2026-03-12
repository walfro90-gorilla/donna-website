'use server';

import { createAdminClient } from '@/lib/supabase/admin';

type CourierStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'inactive';

const VALID_STATUSES: CourierStatus[] = ['pending', 'approved', 'rejected', 'suspended', 'inactive'];

export async function updateCourierStatus(userId: string, newStatus: CourierStatus): Promise<{ error: string | null }> {
    if (!userId || !VALID_STATUSES.includes(newStatus)) {
        return { error: 'Parámetros inválidos' };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('delivery_agent_profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    if (error) {
        console.error('updateCourierStatus error:', error);
        return { error: error.message };
    }

    return { error: null };
}

export async function updateCourierProfile(
    userId: string,
    profileData: {
        name?: string;
        phone?: string;
        emergency_contact_name?: string;
        emergency_contact_phone?: string;
        vehicle_plate?: string;
        vehicle_model?: string;
        vehicle_color?: string;
    }
): Promise<{ error: string | null }> {
    const supabase = createAdminClient();

    // Update user fields (name, phone)
    if (profileData.name !== undefined || profileData.phone !== undefined) {
        const userFields: Record<string, string> = {};
        if (profileData.name !== undefined) userFields.name = profileData.name;
        if (profileData.phone !== undefined) userFields.phone = profileData.phone;

        const { error: userError } = await supabase
            .from('users')
            .update({ ...userFields, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (userError) return { error: userError.message };
    }

    // Update courier profile fields
    const courierFields: Record<string, string> = {};
    if (profileData.emergency_contact_name !== undefined) courierFields.emergency_contact_name = profileData.emergency_contact_name;
    if (profileData.emergency_contact_phone !== undefined) courierFields.emergency_contact_phone = profileData.emergency_contact_phone;
    if (profileData.vehicle_plate !== undefined) courierFields.vehicle_plate = profileData.vehicle_plate;
    if (profileData.vehicle_model !== undefined) courierFields.vehicle_model = profileData.vehicle_model;
    if (profileData.vehicle_color !== undefined) courierFields.vehicle_color = profileData.vehicle_color;

    if (Object.keys(courierFields).length > 0) {
        const { error: profileError } = await supabase
            .from('delivery_agent_profiles')
            .update({ ...courierFields, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (profileError) return { error: profileError.message };
    }

    return { error: null };
}
