import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface WhatsAppWebhookPayload {
  event: string;
  messageId: string;
  from: string;         // "521XXXXXXXXXX@c.us"
  body: string;
  type: string;         // chat | image | video | document | audio | ptt | sticker
  timestamp: number;
  hasMedia: boolean;
  media?: {
    data: string;       // base64
    mimetype: string;
    filename?: string;
  };
  contactName?: string;
}

export async function POST(req: NextRequest) {
  console.log('[webhook] incoming request');

  // ── 1. Verify webhook secret ──────────────────────────────
  const secret = req.headers.get('x-webhook-secret');
  console.log('[webhook] secret present:', !!secret);
  if (!secret || secret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    console.error('[webhook] UNAUTHORIZED — secret mismatch');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    console.error('[webhook] invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[webhook] event:', payload.event, '| from:', payload.from, '| type:', payload.type);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // ── Bot outbound message (Clawbot sent a reply) ──────────
  if (payload.event === 'bot_message') {
    try {
      const { data: contact } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('id')
        .eq('phone', payload.from)
        .single();

      if (contact) {
        const { data: conv } = await supabaseAdmin
          .from('whatsapp_conversations')
          .select('id')
          .eq('contact_id', contact.id)
          .single();

        if (conv) {
          await supabaseAdmin.from('whatsapp_messages').insert({
            conversation_id: conv.id,
            wa_message_id: payload.messageId,
            direction: 'outbound',
            type: 'text',
            body: payload.body || null,
            status: 'sent',
            sent_by: null, // null = bot
            created_at: new Date(payload.timestamp * 1000).toISOString(),
          });
          console.log('[webhook] bot message saved for conv:', conv.id);
        }
      }
    } catch (err) {
      console.error('[webhook] bot_message save error:', err);
    }
    return NextResponse.json({ ok: true });
  }

  // Only handle incoming messages from this point
  if (payload.event !== 'message') {
    console.log('[webhook] ignoring non-message event:', payload.event);
    return NextResponse.json({ autoRespond: true });
  }

  try {
    // ── 2. Upsert contact ─────────────────────────────────────
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .upsert(
        {
          phone: payload.from,
          name: payload.contactName || null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (contactError || !contact) {
      console.error('[webhook] contact upsert error:', JSON.stringify(contactError));
      return NextResponse.json({ autoRespond: true }, { status: 500 });
    }
    console.log('[webhook] contact id:', contact.id);

    // ── 3. Upsert conversation ────────────────────────────────
    const messagePreview = payload.hasMedia
      ? `[${payload.type === 'ptt' ? 'Audio' : payload.type.charAt(0).toUpperCase() + payload.type.slice(1)}]${payload.body ? ` ${payload.body}` : ''}`
      : (payload.body || '');

    const { data: existingConv } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, bot_active, unread_count')
      .eq('contact_id', contact.id)
      .single();

    let conversationId: string;
    let botActive = true;

    if (existingConv) {
      conversationId = existingConv.id;
      botActive = existingConv.bot_active;
      // Update conversation metadata
      await supabaseAdmin
        .from('whatsapp_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: messagePreview.slice(0, 100),
          unread_count: (existingConv.unread_count ?? 0) + 1,
          status: existingConv.bot_active ? 'open' : 'in_progress',
        })
        .eq('id', conversationId);
    } else {
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('whatsapp_conversations')
        .insert({
          contact_id: contact.id,
          status: 'open',
          bot_active: true,
          last_message_at: new Date().toISOString(),
          last_message_preview: messagePreview.slice(0, 100),
          unread_count: 1,
        })
        .select('id, bot_active')
        .single();

      if (convError || !newConv) {
        console.error('[webhook] conversation insert error:', JSON.stringify(convError));
        return NextResponse.json({ autoRespond: true }, { status: 500 });
      }
      conversationId = newConv.id;
      botActive = newConv.bot_active;
      console.log('[webhook] new conversation created:', conversationId);
    }

    // ── 4. Handle media upload ────────────────────────────────
    let mediaUrl: string | null = null;

    if (payload.hasMedia && payload.media?.data) {
      try {
        const buffer = Buffer.from(payload.media.data, 'base64');
        const ext = payload.media.mimetype.split('/')[1]?.split(';')[0] || 'bin';
        const filename = payload.media.filename || `${payload.messageId}.${ext}`;
        const storagePath = `${conversationId}/${filename}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('whatsapp-media')
          .upload(storagePath, buffer, {
            contentType: payload.media.mimetype,
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = await supabaseAdmin.storage
            .from('whatsapp-media')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days
          mediaUrl = urlData?.signedUrl || null;
        }
      } catch (mediaErr) {
        console.error('Media upload error:', mediaErr);
        // Non-fatal — message still saved without media
      }
    }

    // ── 5. Insert message ─────────────────────────────────────
    const msgType = payload.type === 'chat' ? 'text' : (
      ['image', 'video', 'document', 'audio', 'ptt', 'sticker'].includes(payload.type)
        ? payload.type
        : 'unknown'
    );

    const { error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        wa_message_id: payload.messageId,
        direction: 'inbound',
        type: msgType,
        body: payload.body || null,
        media_url: mediaUrl,
        media_mimetype: payload.media?.mimetype || null,
        media_filename: payload.media?.filename || null,
        status: 'delivered',
        created_at: new Date(payload.timestamp * 1000).toISOString(),
      });

    if (msgError) {
      console.error('[webhook] message insert error:', JSON.stringify(msgError));
    } else {
      console.log('[webhook] message saved OK, autoRespond:', botActive);
    }

    // ── 6. Return bot control flag ────────────────────────────
    return NextResponse.json({ autoRespond: botActive });
  } catch (err) {
    console.error('[webhook] UNHANDLED ERROR:', err);
    // On error, let the bot respond to avoid silent failures
    return NextResponse.json({ autoRespond: true }, { status: 500 });
  }
}
