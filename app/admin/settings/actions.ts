'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export interface PlatformSettings {
  default_delivery_fee: number;
  default_commission_bps: number;
  min_order_amount: number;
  updated_at?: string;
  updated_by_name?: string;
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('platform_settings').select('*');

  const defaults: PlatformSettings = {
    default_delivery_fee: 35,
    default_commission_bps: 1500,
    min_order_amount: 0,
  };

  if (error || !data) return defaults;

  const map: Record<string, string> = {};
  data.forEach((row: any) => { map[row.key] = row.value; });

  return {
    default_delivery_fee: Number(map['default_delivery_fee'] ?? defaults.default_delivery_fee),
    default_commission_bps: Number(map['default_commission_bps'] ?? defaults.default_commission_bps),
    min_order_amount: Number(map['min_order_amount'] ?? defaults.min_order_amount),
    updated_at: data.sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at))[0]?.updated_at,
  };
}

export async function updatePlatformSettings(
  settings: Omit<PlatformSettings, 'updated_at' | 'updated_by_name'>
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data: { user } } = await (await createClient()).auth.getUser();

    const rows = [
      { key: 'default_delivery_fee', value: String(settings.default_delivery_fee), updated_at: new Date().toISOString(), updated_by: user?.id || null },
      { key: 'default_commission_bps', value: String(settings.default_commission_bps), updated_at: new Date().toISOString(), updated_by: user?.id || null },
      { key: 'min_order_amount', value: String(settings.min_order_amount), updated_at: new Date().toISOString(), updated_by: user?.id || null },
    ];

    const { error } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' });
    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al guardar configuración' };
  }
}
