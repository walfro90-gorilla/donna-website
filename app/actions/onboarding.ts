
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markRestaurantWelcomeAsSeen() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            has_seen_restaurant_welcome: true,
            restaurant_welcome_seen_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    revalidatePath('/restaurant');
}

export async function markDeliveryWelcomeAsSeen() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            has_seen_delivery_welcome: true,
            delivery_welcome_seen_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    revalidatePath('/delivery_agent/dashboard');
}
