'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type CreateUserState = {
    message: string;
    error?: string;
    success?: boolean;
};

export async function createUserProfile(prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
    const supabase = createAdminClient();

    // Extract core fields
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const role = formData.get('role') as 'client' | 'restaurant' | 'delivery_agent';

    // Extract restaurant specific fields
    const restaurantName = formData.get('restaurantName') as string;
    const address = formData.get('address') as string;
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    const placeId = formData.get('placeId') as string;
    const addressStructuredStr = formData.get('address_structured') as string;

    // Extract delivery specific fields
    const vehicleType = formData.get('vehicleType') as string;

    console.log(' Creating User Profile:', {
        email,
        role,
        phone,
        restaurantName,
        address,
        coordinates: `${latitudeStr}, ${longitudeStr}`
    });

    if (!email || !password || !name || !role) {
        return { message: 'Faltan campos requeridos', error: 'Missing fields' };
    }

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role },
        });

        if (authError) {
            console.error('Auth Error:', authError);
            return { message: 'Error al crear usuario en Auth: ' + authError.message, error: authError.message };
        }

        const userId = authData.user.id;

        // 2. Insert into public.users
        const { error: usersError } = await supabase.from('users').insert({
            id: userId,
            email,
            name,
            phone,
            role,
            email_confirm: true,
        });

        if (usersError) {
            console.error('Users Error:', usersError);
            return { message: 'Error al crear registro de usuario: ' + usersError.message, error: usersError.message };
        }

        // 3. Insert into public.accounts
        const { error: accountsError } = await supabase.from('accounts').insert({
            user_id: userId,
            account_type: role,
            balance: 0.00,
        });

        if (accountsError) {
            console.error('Accounts Error:', accountsError);
            return { message: 'Error al crear cuenta: ' + accountsError.message, error: accountsError.message };
        }

        // 4. Insert into public.user_preferences
        const { error: prefsError } = await supabase.from('user_preferences').insert({
            user_id: userId,
            has_seen_onboarding: false,
        });

        if (prefsError) {
            console.error('Prefs Error:', prefsError);
            return { message: 'Error al crear preferencias: ' + prefsError.message, error: prefsError.message };
        }

        // 5. Insert into specific profile table
        if (role === 'restaurant') {
            if (!restaurantName) {
                return { message: 'Nombre del restaurante es requerido', error: 'Missing restaurant name' };
            }

            // Parse numeric coordinates
            const lat = parseFloat(latitudeStr);
            const lon = parseFloat(longitudeStr);
            const hasLocation = !isNaN(lat) && !isNaN(lon);

            // Parse structured address safely
            let addressStructured = null;
            try {
                if (addressStructuredStr && addressStructuredStr !== 'null') {
                    addressStructured = JSON.parse(addressStructuredStr);
                }
            } catch (e) {
                console.error('Error parsing address_structured:', e);
            }

            // Fallback: Manually construct if missing but we have coordinates
            if (!addressStructured && hasLocation && address) {
                addressStructured = {
                    types: ['geocode'], // Default type
                    placeId: placeId || '',
                    coordinates: {
                        lat: lat,
                        lng: lon
                    },
                    description: address
                };
            }

            const { data: restData, error: restError } = await supabase.from('restaurants').insert({
                user_id: userId,
                name: restaurantName,
                address: address || null,
                phone: phone || null,
                location_lat: hasLocation ? lat : null,
                location_lon: hasLocation ? lon : null,
                location_place_id: placeId || null,
                address_structured: addressStructured,
                location: hasLocation ? `POINT(${lon} ${lat})` : null,
                status: 'approved', // Auto approve if created by admin
                commission_bps: 1500,
            }).select().single();

            if (restError) {
                console.error('Restaurant Error:', restError);
                return { message: 'Error al crear restaurante: ' + restError.message, error: restError.message };
            }

            if (restData) {
                const { error: updatePrefsError } = await supabase
                    .from('user_preferences')
                    .update({ restaurant_id: restData.id })
                    .eq('user_id', userId);

                if (updatePrefsError) {
                    console.error('Error linking restaurant to preferences:', updatePrefsError);
                    // Do not fail the whole process, but log it
                }
            }


        } else if (role === 'delivery_agent') {
            const { error: deliveryError } = await supabase.from('delivery_agent_profiles').insert({
                user_id: userId,
                status: 'active', // Auto active
                account_state: 'approved',
                vehicle_type: vehicleType || 'motocicleta',
            });
            if (deliveryError) {
                console.error('Delivery Error:', deliveryError);
                return { message: 'Error al crear repartidor: ' + deliveryError.message, error: deliveryError.message };
            }
        } else if (role === 'client') {
            const { error: clientError } = await supabase.from('client_profiles').insert({
                user_id: userId,
                status: 'active',
            });
            if (clientError) {
                console.error('Client Error:', clientError);
                return { message: 'Error al crear cliente: ' + clientError.message, error: clientError.message };
            }
        }

        revalidatePath('/admin/users');
        revalidatePath('/admin/restaurants');
        revalidatePath('/admin/couriers');

        return { message: 'Usuario creado exitosamente', success: true };

    } catch (error: any) {
        console.error('Unexpected Error:', error);
        return { message: 'Error inesperado: ' + error.message, error: error.message };
    }
}
