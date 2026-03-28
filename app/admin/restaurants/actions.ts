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
      .update({ online, business_hours_enabled: false, updated_at: new Date().toISOString() })
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

export async function updateRestaurantSchedule(
  restaurantId: string,
  data: {
    business_hours: Record<string, { enabled: boolean; open: string; close: string }>;
    business_hours_enabled: boolean;
  },
): Promise<{ error: string | null }> {
  if (!restaurantId) return { error: 'ID de restaurante requerido' };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('restaurants')
      .update({
        business_hours: data.business_hours,
        business_hours_enabled: data.business_hours_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurantId);
    if (error) return { error: error.message };
    return { error: null };
  } catch (e) {
    console.error('[updateRestaurantSchedule]', e);
    return { error: 'Error al actualizar horarios' };
  }
}

export async function updateModifier(
  modifierId: string,
  data: { name?: string; price_delta?: number },
): Promise<{ error: string | null }> {
  if (data.price_delta !== undefined && data.price_delta < 0)
    return { error: 'El precio no puede ser negativo' };
  if (data.name !== undefined && !data.name.trim())
    return { error: 'El nombre no puede estar vacío' };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('modifiers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', modifierId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar extra' };
  }
}

export async function deleteModifier(
  modifierId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('modifiers')
      .delete()
      .eq('id', modifierId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al eliminar extra' };
  }
}

/** @deprecated use updateModifier */
export async function updateModifierPrice(
  modifierId: string,
  priceDelta: number,
): Promise<{ error: string | null }> {
  return updateModifier(modifierId, { price_delta: priceDelta });
}

export async function updateProductInfo(
  productId: string,
  data: { name?: string; description?: string },
): Promise<{ error: string | null }> {
  if (data.name !== undefined && !data.name.trim())
    return { error: 'El nombre no puede estar vacío' };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('products')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar producto' };
  }
}

export async function updateProductPrice(
  productId: string,
  price: number,
): Promise<{ error: string | null }> {
  if (price < 0) return { error: 'El precio no puede ser negativo' };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('products')
      .update({ price, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar precio' };
  }
}

export async function toggleProductAvailability(
  productId: string,
  available: boolean,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('products')
      .update({ is_available: available, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar disponibilidad' };
  }
}

export async function createProduct(
  restaurantId: string,
  data: {
    name: string;
    description?: string;
    price: number; // platform price
    type: 'principal' | 'bebida' | 'postre' | 'entrada' | 'combo';
  },
): Promise<{ error: string | null; id?: string }> {
  if (!data.name.trim()) return { error: 'El nombre es requerido' };
  if (data.price <= 0) return { error: 'El precio debe ser mayor a 0' };
  try {
    const supabase = createAdminClient();
    const { error, data: row } = await supabase
      .from('products')
      .insert({
        restaurant_id: restaurantId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
        type: data.type,
        is_available: true,
      })
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { error: null, id: row.id };
  } catch {
    return { error: 'Error al crear producto' };
  }
}

export async function deleteProduct(
  productId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al eliminar producto' };
  }
}

export async function createModifier(
  groupId: string,
  data: { name: string; price_delta: number },
): Promise<{ error: string | null; id?: string }> {
  if (!data.name.trim()) return { error: 'El nombre no puede estar vacío' };
  if (data.price_delta < 0) return { error: 'El precio no puede ser negativo' };
  try {
    const supabase = createAdminClient();
    const { error, data: row } = await supabase
      .from('modifiers')
      .insert({ group_id: groupId, name: data.name.trim(), price_delta: data.price_delta })
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { error: null, id: row.id };
  } catch {
    return { error: 'Error al crear opción' };
  }
}

/**
 * Crea un nuevo grupo de extras a nivel restaurante y lo asigna al producto.
 * El grupo queda en la librería del restaurante para reutilizarse.
 */
export async function createModifierGroup(
  productId: string,
  data: { name: string; selection_type: 'single' | 'multiple' },
): Promise<{ error: string | null; id?: string }> {
  if (!data.name.trim()) return { error: 'El nombre no puede estar vacío' };
  try {
    const supabase = createAdminClient();
    // 1. Lookup restaurant_id from product
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('restaurant_id')
      .eq('id', productId)
      .single();
    if (pErr || !product) return { error: 'Producto no encontrado' };

    // 2. Create group at restaurant level
    const { error: gErr, data: group } = await supabase
      .from('modifier_groups')
      .insert({
        restaurant_id: product.restaurant_id,
        name: data.name.trim(),
        selection_type: data.selection_type,
      })
      .select('id')
      .single();
    if (gErr) return { error: gErr.message };

    // 3. Link to product via join table
    const { error: lErr } = await supabase
      .from('product_modifier_groups')
      .insert({ product_id: productId, modifier_group_id: group.id });
    if (lErr) return { error: lErr.message };

    return { error: null, id: group.id };
  } catch {
    return { error: 'Error al crear grupo' };
  }
}

/**
 * Asigna un grupo de la librería del restaurante a un producto específico.
 */
export async function assignModifierGroup(
  productId: string,
  groupId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('product_modifier_groups')
      .insert({ product_id: productId, modifier_group_id: groupId });
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al asignar grupo' };
  }
}

/**
 * Desvincula un grupo de un producto sin eliminarlo de la librería.
 */
export async function detachModifierGroup(
  productId: string,
  groupId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('product_modifier_groups')
      .delete()
      .eq('product_id', productId)
      .eq('modifier_group_id', groupId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al desvincular grupo' };
  }
}

/**
 * Elimina un grupo completamente de la librería (y de todos los productos).
 */
export async function deleteModifierGroup(
  groupId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('modifier_groups')
      .delete()
      .eq('id', groupId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al eliminar grupo' };
  }
}

export async function updateModifierGroup(
  groupId: string,
  data: { name?: string; selection_type?: 'single' | 'multiple' },
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('modifier_groups')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', groupId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar grupo' };
  }
}

export async function updateRestaurantImage(
  restaurantId: string,
  field: 'cover_image_url' | 'logo_url' | 'facade_image_url',
  url: string,
): Promise<{ error: string | null }> {
  if (!restaurantId) return { error: 'ID de restaurante requerido' };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('restaurants')
      .update({ [field]: url, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al actualizar imagen' };
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
