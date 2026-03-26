import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ── 1. Auth — only admins ─────────────────────────────────
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

  // ── 2. Parse body ─────────────────────────────────────────
  let body: {
    conversationId: string;
    message?: string;
    mediaBase64?: string;
    mimetype?: string;
    filename?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.conversationId || (!body.message && !body.mediaBase64)) {
    return NextResponse.json({ error: 'conversationId and message or media required' }, { status: 400 });
  }

  // ── 3. Get conversation + contact phone ───────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: conv, error: convError } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('id, contact_id')
    .eq('id', body.conversationId)
    .single();

  if (convError || !conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { data: contactRow } = await supabaseAdmin
    .from('whatsapp_contacts')
    .select('phone')
    .eq('id', conv.contact_id)
    .single();

  const contactPhone = contactRow?.phone;
  if (!contactPhone) {
    return NextResponse.json({ error: 'Contact phone not found' }, { status: 404 });
  }

  // ── 4. Call Clawbot send endpoint ─────────────────────────
  const botUrl = process.env.WHATSAPP_BOT_URL;
  const botSecret = process.env.WHATSAPP_BOT_SECRET;

  if (!botUrl || !botSecret) {
    console.error('[send] Missing env vars — WHATSAPP_BOT_URL:', !!botUrl, 'WHATSAPP_BOT_SECRET:', !!botSecret);
    return NextResponse.json({ error: 'Bot URL not configured' }, { status: 500 });
  }

  const clawbotPayload: Record<string, string | undefined> = {
    to: contactPhone,
    message: body.message,
    mediaBase64: body.mediaBase64,
    mimetype: body.mimetype,
    filename: body.filename,
  };

  // Remove undefined keys
  Object.keys(clawbotPayload).forEach(k => {
    if (clawbotPayload[k] === undefined) delete clawbotPayload[k];
  });

  let botResponse: Response;
  try {
    botResponse = await fetch(`${botUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': botSecret,
      },
      body: JSON.stringify(clawbotPayload),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error('[send] Network error reaching Clawbot:', msg);
    return NextResponse.json(
      { error: `No se pudo conectar al bot (${msg}). Verifica que el servidor UpCloud esté activo y el puerto 3000 sea accesible.` },
      { status: 503 }
    );
  }

  if (!botResponse.ok) {
    const errText = await botResponse.text().catch(() => '(no body)');
    console.error('[send] Clawbot responded with', botResponse.status, ':', errText);
    const hint =
      botResponse.status === 401
        ? 'El secreto DONNA_BOT_SECRET en UpCloud no coincide con WHATSAPP_BOT_SECRET en Vercel.'
        : `Clawbot devolvió ${botResponse.status}: ${errText}`;
    return NextResponse.json({ error: hint }, { status: 502 });
  }

  // ── 5. Save outbound message to DB ────────────────────────
  let mediaUrl: string | null = null;
  let mediaFilename = body.filename || null;

  if (body.mediaBase64 && body.mimetype) {
    try {
      const buffer = Buffer.from(body.mediaBase64, 'base64');
      const ext = body.mimetype.split('/')[1]?.split(';')[0] || 'bin';
      const fname = body.filename || `outbound_${Date.now()}.${ext}`;
      const storagePath = `${body.conversationId}/${fname}`;
      mediaFilename = fname;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('whatsapp-media')
        .upload(storagePath, buffer, {
          contentType: body.mimetype,
          upsert: false,
        });

      if (!uploadError) {
        const { data: urlData } = await supabaseAdmin.storage
          .from('whatsapp-media')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
        mediaUrl = urlData?.signedUrl || null;
      }
    } catch (mediaErr) {
      console.error('Media upload error (outbound):', mediaErr);
    }
  }

  const msgType = body.mediaBase64 && body.mimetype
    ? (body.mimetype.startsWith('image') ? 'image'
      : body.mimetype.startsWith('video') ? 'video'
      : body.mimetype.startsWith('audio') ? 'audio'
      : 'document')
    : 'text';

  const { data: savedMessage, error: msgError } = await supabaseAdmin
    .from('whatsapp_messages')
    .insert({
      conversation_id: body.conversationId,
      direction: 'outbound',
      type: msgType,
      body: body.message || null,
      media_url: mediaUrl,
      media_mimetype: body.mimetype || null,
      media_filename: mediaFilename,
      status: 'sent',
      sent_by: user.id,
    })
    .select()
    .single();

  if (msgError) {
    console.error('Message insert error:', msgError);
    // Bot already sent — return partial success
    return NextResponse.json({ warning: 'Sent but failed to save', error: msgError.message }, { status: 207 });
  }

  // Update conversation last message
  await supabaseAdmin
    .from('whatsapp_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: body.message
        ? body.message.slice(0, 100)
        : `[${msgType.charAt(0).toUpperCase() + msgType.slice(1)}]`,
    })
    .eq('id', body.conversationId);

  return NextResponse.json({ message: savedMessage });
}
