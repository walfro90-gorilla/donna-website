'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function forgivClientDebt(
  debtId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data: { user } } = await (await createClient()).auth.getUser();

    const { error } = await supabase
      .from('client_debts')
      .update({
        status: 'forgiven',
        forgiven_at: new Date().toISOString(),
        forgiven_by: user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', debtId);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al perdonar deuda' };
  }
}

export async function liftClientSuspension(
  clientId: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('client_account_suspensions')
      .update({
        is_suspended: false,
        failed_attempts: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId);

    if (error) return { error: error.message };
    return { error: null };
  } catch {
    return { error: 'Error al levantar suspensión' };
  }
}
