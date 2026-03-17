import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── 1. Auth ───────────────────────────────────────────────
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── 2. Parse ──────────────────────────────────────────────
  const { id: conversationId } = await params;

  let body: { bot_active: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.bot_active !== 'boolean') {
    return NextResponse.json({ error: 'bot_active (boolean) required' }, { status: 400 });
  }

  // ── 3. Update ─────────────────────────────────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const updatePayload: Record<string, unknown> = {
    bot_active: body.bot_active,
  };

  if (!body.bot_active) {
    // Pausing
    updatePayload.bot_paused_by = user.id;
    updatePayload.bot_paused_at = new Date().toISOString();
    updatePayload.status = 'in_progress';
  } else {
    // Resuming
    updatePayload.bot_paused_by = null;
    updatePayload.bot_paused_at = null;
    updatePayload.status = 'open';
  }

  const { data: updated, error } = await supabaseAdmin
    .from('whatsapp_conversations')
    .update(updatePayload)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: updated });
}
