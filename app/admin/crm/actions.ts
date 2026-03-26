'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

// ── Types ───────────────────────────────────────────────────────────────────

export interface CrmUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// ── 1. Search user by normalized phone ──────────────────────────────────────
// Tries multiple formats: raw digits, +prefix, and suffix match (last 10 digits)
// because WA stores "521XXXXXXXXXX" but users may have registered as "+521XXXXXXXXXX"

export async function searchUserByPhone(
  phone: string,
): Promise<{ user: CrmUser | null; error: string | null }> {
  try {
    const supabase = createAdminClient();

    // Strip everything except digits for comparison
    const digits = phone.replace(/\D/g, '');

    // Build all candidate formats to search
    const candidates = Array.from(new Set([
      digits,           // e.g. "521XXXXXXXXXX"
      `+${digits}`,     // e.g. "+521XXXXXXXXXX"
      phone,            // original normalized (in case it already has +)
    ]));

    for (const candidate of candidates) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('phone', candidate)
        .maybeSingle();

      if (!error && data) return { user: data as CrmUser, error: null };
    }

    // Last resort: match by last 10 digits (handles country code variations)
    if (digits.length >= 10) {
      const suffix = digits.slice(-10);
      const { data } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .ilike('phone', `%${suffix}`)
        .limit(1)
        .maybeSingle();

      if (data) return { user: data as CrmUser, error: null };
    }

    return { user: null, error: null };
  } catch {
    return { user: null, error: 'Error al buscar usuario' };
  }
}

// ── 2. Register new user from CRM contact ───────────────────────────────────

export async function registerCrmUser(params: {
  name: string;
  phone: string;
  email?: string;
  contactId: string;
}): Promise<{ userId: string | null; error: string | null }> {
  const supabase = createAdminClient();
  const email = params.email?.trim() || `wa${params.phone}@donnarepartos.internal`;
  const tempPassword = randomUUID();

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      phone: params.phone,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: params.name },
    });

    if (authError) return { userId: null, error: authError.message };
    const userId = authData.user.id;

    // 2. Insert into users table
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email,
      name: params.name,
      phone: params.phone,
      role: 'client',
      email_confirm: true,
    });

    if (userError) {
      // Rollback auth user if users insert fails
      await supabase.auth.admin.deleteUser(userId);
      return { userId: null, error: userError.message };
    }

    // 3. Insert client_profile (empty, for FK integrity)
    await supabase.from('client_profiles').insert({ user_id: userId });

    // 4. Link whatsapp_contact → user
    await supabase
      .from('whatsapp_contacts')
      .update({ user_id: userId })
      .eq('id', params.contactId);

    return { userId, error: null };
  } catch (err) {
    console.error('[registerCrmUser]', err);
    return { userId: null, error: 'Error inesperado al registrar usuario' };
  }
}

// ── 3. Link existing user to WA contact ─────────────────────────────────────

export async function linkContactToUser(
  contactId: string,
  userId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('whatsapp_contacts')
      .update({ user_id: userId })
      .eq('id', contactId);

    return { error: error?.message ?? null };
  } catch {
    return { error: 'Error al vincular contacto' };
  }
}

// ── 4. Create manual order ───────────────────────────────────────────────────

export async function createManualOrder(params: {
  userId: string;
  restaurantId: string;
  items: OrderItem[];
  deliveryAddress: string;
  paymentMethod: 'cash' | 'card';
  notes?: string;
  adminId: string;
}): Promise<{ orderId: string | null; error: string | null }> {
  const supabase = createAdminClient();

  try {
    // 1. Get restaurant delivery_fee
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('delivery_fee')
      .eq('id', params.restaurantId)
      .single();

    if (restError || !restaurant) {
      return { orderId: null, error: 'Restaurante no encontrado' };
    }

    const deliveryFee: number = restaurant.delivery_fee ?? 35;
    const subtotal = params.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const totalAmount = subtotal + deliveryFee;

    // 2. Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: params.userId,
        restaurant_id: params.restaurantId,
        status: 'pending',
        payment_method: params.paymentMethod,
        payment_status: 'pending',
        delivery_address: params.deliveryAddress,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        order_notes: params.notes || null,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      return { orderId: null, error: orderError?.message ?? 'Error al crear orden' };
    }

    const orderId = order.id;

    // 3. Insert order items
    const orderItems = params.items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      price_at_time_of_order: item.quantity * item.unitPrice,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('[createManualOrder] items error:', itemsError);
    }

    // 4. Insert status audit record
    await supabase.from('order_status_updates').insert({
      order_id: orderId,
      status: 'pending',
      actor_role: 'admin',
      actor_id: params.adminId,
      updated_by_user_id: params.adminId,
      notes: 'Orden creada manualmente desde CRM WhatsApp',
    });

    return { orderId, error: null };
  } catch (err) {
    console.error('[createManualOrder]', err);
    return { orderId: null, error: 'Error inesperado al crear orden' };
  }
}
