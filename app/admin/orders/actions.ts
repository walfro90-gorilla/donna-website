'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ORDER_STATUSES = [
  'pending', 'confirmed', 'preparing', 'in_preparation', 'ready_for_pickup',
  'assigned', 'picked_up', 'on_the_way', 'in_transit', 'delivered', 'cancelled', 'not_delivered',
] as const;

type OrderStatus = typeof ORDER_STATUSES[number];

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<{ error: string | null }> {
  if (!ORDER_STATUSES.includes(newStatus)) {
    return { error: 'Estado inválido' };
  }

  try {
    const supabase = createAdminClient();

    const { data: { user } } = await (await createClient()).auth.getUser();

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) return { error: error.message };

    // Log the status update
    await supabase.from('order_status_updates').insert({
      order_id: orderId,
      status: newStatus,
      actor_role: 'admin',
      actor_id: user?.id || null,
      updated_by_user_id: user?.id || null,
      notes: 'Actualizado por admin',
    });

    return { error: null };
  } catch (err) {
    return { error: 'Error al actualizar estado' };
  }
}

export async function reassignCourier(
  orderId: string,
  newCourierId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('orders')
      .update({ delivery_agent_id: newCourierId, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al reasignar repartidor' };
  }
}

export async function cancelOrder(
  orderId: string,
  reason: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data: { user } } = await (await createClient()).auth.getUser();

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) return { error: error.message };

    await supabase.from('order_status_updates').insert({
      order_id: orderId,
      status: 'cancelled',
      actor_role: 'admin',
      actor_id: user?.id || null,
      updated_by_user_id: user?.id || null,
      notes: `Cancelado por admin. Razón: ${reason}`,
    });

    return { error: null };
  } catch {
    return { error: 'Error al cancelar pedido' };
  }
}
