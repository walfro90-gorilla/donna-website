'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeTour() {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return { error: 'No authenticated session' };
    }

    // Update user_preferences table
    const { error } = await supabase
        .from('user_preferences')
        .update({ has_seen_tour: true })
        .eq('user_id', session.user.id);

    if (error) {
        console.error('Error updating tour status:', error);
        return { error: error.message };
    }

    revalidatePath('/socios/dashboard');
    return { success: true };
}
