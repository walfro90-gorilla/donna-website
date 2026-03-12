'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function toggleRestaurantOnline(
  restaurantId: string,
  online: boolean,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('restaurants')
      .update({ online, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar estado online' };
  }
}

export async function updateRestaurantCommission(
  restaurantId: string,
  commissionBps: number,
): Promise<{ error: string | null }> {
  if (commissionBps < 0 || commissionBps > 3000) {
    return { error: 'La comisión debe estar entre 0 y 3000 bps' };
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('restaurants')
      .update({ commission_bps: commissionBps, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar comisión' };
  }
}

export async function updateRestaurantStatus(
  restaurantId: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('restaurants')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar estado' };
  }
}

export async function updateRestaurantInfo(
  restaurantId: string,
  data: {
    name?: string;
    description?: string;
    phone?: string;
    cuisine_type?: string;
    delivery_fee?: number;
    min_order_amount?: number;
    estimated_delivery_time_minutes?: number;
  },
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('restaurants')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar restaurante' };
  }
}
