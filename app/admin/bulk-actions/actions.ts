'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface BulkOrder {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  total_amount: number;
  is_test: boolean;
  user_name: string | null;
  user_email: string | null;
  restaurant_name: string | null;
}

export interface BulkUser {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_test: boolean;
  orders_count: number;
}

export interface PreviewResult {
  orders_total?: number;
  transactions_total?: number;
  accounts_affected?: number;
  balance_impact?: number;
  has_completed_settlements?: boolean;
  skippable_orders?: string[];
  users_total?: number;
  orders_total_users?: number;
  roles?: string[];
  has_restaurant_with_orders?: boolean;
}

export interface BulkResult {
  deleted: number;
  skipped: { id: string; reason: string }[];
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Queries de listado ────────────────────────────────────────────────────────

export async function fetchTestOrders(filters: {
  isTest?: boolean;
  status?: string;
  maxAmount?: number;
  emailContains?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ data: BulkOrder[]; error: string | null }> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('orders')
      .select(`
        id, created_at, status, payment_method, total_amount, is_test,
        users!orders_user_id_fkey(name, email),
        restaurants(name)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters.isTest !== undefined) {
      query = query.eq('is_test', filters.isTest);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.maxAmount !== undefined) {
      query = query.lte('total_amount', filters.maxAmount);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59Z');
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const orders: BulkOrder[] = (data ?? []).map((o: any) => ({
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      payment_method: o.payment_method,
      total_amount: o.total_amount,
      is_test: o.is_test,
      user_name: o.users?.name ?? null,
      user_email: o.users?.email ?? null,
      restaurant_name: o.restaurants?.name ?? null,
    }));

    // Filtro por email del cliente (no se puede hacer con PostgREST directamente en join)
    const filtered = filters.emailContains
      ? orders.filter((o) =>
          o.user_email?.toLowerCase().includes(filters.emailContains!.toLowerCase())
        )
      : orders;

    return { data: filtered, error: null };
  } catch {
    return { data: [], error: 'Error al obtener pedidos' };
  }
}

export async function fetchTestUsers(filters: {
  isTest?: boolean;
  emailContains?: string;
  role?: string;
  noRealOrders?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ data: BulkUser[]; error: string | null }> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('users')
      .select('id, created_at, name, email, phone, role, is_test')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters.isTest !== undefined) {
      query = query.eq('is_test', filters.isTest);
    }
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.emailContains) {
      query = query.ilike('email', `%${filters.emailContains}%`);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59Z');
    }

    const { data: usersData, error } = await query;
    if (error) return { data: [], error: error.message };
    if (!usersData?.length) return { data: [], error: null };

    // Contar órdenes por usuario
    const userIds = usersData.map((u) => u.id);
    const { data: orderCounts } = await supabase
      .from('orders')
      .select('user_id')
      .in('user_id', userIds);

    const countMap = new Map<string, number>();
    (orderCounts ?? []).forEach((o: any) => {
      countMap.set(o.user_id, (countMap.get(o.user_id) ?? 0) + 1);
    });

    const users: BulkUser[] = usersData.map((u: any) => ({
      id: u.id,
      created_at: u.created_at,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      is_test: u.is_test,
      orders_count: countMap.get(u.id) ?? 0,
    }));

    const filtered = filters.noRealOrders
      ? users.filter((u) => u.orders_count === 0)
      : users;

    return { data: filtered, error: null };
  } catch {
    return { data: [], error: 'Error al obtener usuarios' };
  }
}

// ── Marcar como prueba ────────────────────────────────────────────────────────

export async function markAsTest(
  entityType: 'order' | 'user',
  ids: string[],
  isTest: boolean,
): Promise<{ error: string | null }> {
  if (!ids.length) return { error: null };
  try {
    const admin = await getAdminUser();
    const supabase = createAdminClient();

    const { error } = await supabase.rpc('admin_mark_as_test', {
      p_entity_type: entityType,
      p_ids: ids,
      p_is_test: isTest,
      p_admin_id: admin?.id ?? null,
    });

    return { error: error?.message ?? null };
  } catch {
    return { error: 'Error al marcar registros' };
  }
}

// ── Preview de impacto ────────────────────────────────────────────────────────

export async function previewDeleteOrders(
  orderIds: string[],
): Promise<{ data: PreviewResult | null; error: string | null }> {
  if (!orderIds.length) return { data: null, error: null };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('admin_preview_delete_orders', {
      p_order_ids: orderIds,
    });
    if (error) return { data: null, error: error.message };
    return { data: data as PreviewResult, error: null };
  } catch {
    return { data: null, error: 'Error al calcular preview' };
  }
}

export async function previewDeleteUsers(
  userIds: string[],
): Promise<{ data: PreviewResult | null; error: string | null }> {
  if (!userIds.length) return { data: null, error: null };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('admin_preview_delete_users', {
      p_user_ids: userIds,
    });
    if (error) return { data: null, error: error.message };
    return { data: data as PreviewResult, error: null };
  } catch {
    return { data: null, error: 'Error al calcular preview' };
  }
}

// ── Eliminación bulk ──────────────────────────────────────────────────────────

export async function deleteOrdersBulk(
  orderIds: string[],
): Promise<BulkResult> {
  if (!orderIds.length) return { deleted: 0, skipped: [] };
  try {
    const admin = await getAdminUser();
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('admin_delete_orders_bulk', {
      p_order_ids: orderIds,
      p_admin_id: admin?.id,
    });

    if (error) return { deleted: 0, skipped: [], error: error.message };

    const result = data as { deleted: number; skipped: { id: string; reason: string }[] };
    return { deleted: result.deleted, skipped: result.skipped ?? [] };
  } catch {
    return { deleted: 0, skipped: [], error: 'Error al eliminar pedidos' };
  }
}

export async function deleteUsersBulk(
  userIds: string[],
): Promise<BulkResult> {
  if (!userIds.length) return { deleted: 0, skipped: [] };
  try {
    const admin = await getAdminUser();
    const supabase = createAdminClient();

    // 1. RPC borra de public.users + maneja FKs + revierte finanzas
    const { data, error } = await supabase.rpc('admin_delete_users_bulk', {
      p_user_ids: userIds,
      p_admin_id: admin?.id,
    });

    if (error) return { deleted: 0, skipped: [], error: error.message };

    const result = data as {
      deleted: number;
      auth_ids: string[];
      skipped: { id: string; reason: string }[];
    };

    // 2. Borrar de auth.users (requiere service role — admin client lo tiene)
    for (const authId of result.auth_ids ?? []) {
      await supabase.auth.admin.deleteUser(authId);
    }

    return { deleted: result.deleted, skipped: result.skipped ?? [] };
  } catch {
    return { deleted: 0, skipped: [], error: 'Error al eliminar usuarios' };
  }
}
