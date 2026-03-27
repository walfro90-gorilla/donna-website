import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface WhatsAppWebhookPayload {
  event: string;
  messageId: string;
  from: string;       // "521XXXXXXXXXX@c.us" — contact phone for inbound, bot phone for outbound
  to?: string;        // recipient phone for outbound messages
  body: string;
  type: string;       // chat | image | video | document | audio | ptt | sticker
  timestamp: number;
  hasMedia: boolean;
  fromMe?: boolean;   // true when the message was sent BY the bot/phone
  media?: {
    data: string;     // base64
    mimetype: string;
    filename?: string;
  };
  contactName?: string;
}

/**
 * Strip ALL WhatsApp domain suffixes so the same person is always one contact,
 * regardless of whether WhatsApp sends "@c.us", "@s.whatsapp.net", "@lid", etc.
 * "521XXXXXXXXXX@c.us"           → "521XXXXXXXXXX"
 * "521XXXXXXXXXX@s.whatsapp.net" → "521XXXXXXXXXX"
 * "186969103565018@lid"          → "186969103565018"
 */
function normalizePhone(raw: string): string {
  return raw.split('@')[0].trim();
}

/** Events that represent a message sent FROM the admin to a contact */
const OUTBOUND_EVENTS = new Set([
  'bot_message',
  'manual_message',
  'outbound_message',
  'message_sent',
]);

export async function POST(req: NextRequest) {
  console.log('[webhook] incoming request');

  // ── 1. Verify webhook secret ──────────────────────────────
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    console.error('[webhook] UNAUTHORIZED — secret mismatch');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[webhook] event:', payload.event, '| from:', payload.from, '| fromMe:', payload.fromMe);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // ── 2. Handle OUTBOUND messages (bot reply OR manual from phone) ──
  const isOutbound = OUTBOUND_EVENTS.has(payload.event) ||
    (payload.fromMe === true && payload.event !== 'message');

  if (isOutbound) {
    try {
      // For outbound, the CONTACT's phone is in payload.to (preferred) or payload.from
      const contactPhone = normalizePhone(payload.to || payload.from);

      const { data: contact } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('id')
        .eq('phone', contactPhone)
        .maybeSingle();

      if (!contact) {
        console.log('[webhook] outbound: contact not found for', contactPhone);
        return NextResponse.json({ ok: true });
      }

      const { data: outboundConvRows } = await supabaseAdmin
        .from('whatsapp_conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: true })
        .limit(1);

      const conv = outboundConvRows?.[0] ?? null;

      if (!conv) {
        console.log('[webhook] outbound: no conversation for contact', contact.id);
        return NextResponse.json({ ok: true });
      }

      // Deduplicate: skip if this wa_message_id was already saved
      if (payload.messageId) {
        const { data: existing } = await supabaseAdmin
          .from('whatsapp_messages')
          .select('id')
          .eq('wa_message_id', payload.messageId)
          .maybeSingle();
        if (existing) {
          console.log('[webhook] outbound: duplicate messageId, skipping');
          return NextResponse.json({ ok: true });
        }
      }

      await supabaseAdmin.from('whatsapp_messages').insert({
        conversation_id: conv.id,
        wa_message_id: payload.messageId || null,
        direction: 'outbound',
        type: payload.type === 'chat' ? 'text' : (payload.type || 'text'),
        body: payload.body || null,
        status: 'sent',
        sent_by: null,
        created_at: new Date(payload.timestamp * 1000).toISOString(),
      });

      // Update conversation preview
      await supabaseAdmin.from('whatsapp_conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: (payload.body || '[Media]').slice(0, 100),
      }).eq('id', conv.id);

      console.log('[webhook] outbound message saved for conv:', conv.id);
    } catch (err) {
      console.error('[webhook] outbound save error:', err);
    }
    return NextResponse.json({ ok: true });
  }

  // ── 3. Only handle inbound messages from here ─────────────
  if (payload.event !== 'message') {
    console.log('[webhook] ignoring event:', payload.event);
    return NextResponse.json({ autoRespond: true });
  }

  try {
    // ── 4. Normalize phone & upsert contact ───────────────────
    const normalizedPhone = normalizePhone(payload.from);

    const { data: contact, error: contactError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .upsert(
        {
          phone: normalizedPhone,
          name: payload.contactName || null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select('id, user_id')
      .single();

    if (contactError || !contact) {
      console.error('[webhook] contact upsert error:', JSON.stringify(contactError));
      return NextResponse.json({ autoRespond: true }, { status: 500 });
    }
    console.log('[webhook] contact id:', contact.id, '| phone:', normalizedPhone);

    // ── 4b. Auto-link to platform user if not yet linked ──────
    // Only run if the contact doesn't already have a linked user
    if (!contact.user_id) {
      // Try exact phone match and +prefix variant (handles "+52..." stored phones)
      const { data: linkedUserRows } = await supabaseAdmin
        .from('users')
        .select('id')
        .or(`phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`)
        .order('role')   // 'admin' < 'client' < 'delivery_agent' < 'restaurant' alphabetically
        .limit(1);

      const linkedUserId = linkedUserRows?.[0]?.id ?? null;
      if (linkedUserId) {
        await supabaseAdmin
          .from('whatsapp_contacts')
          .update({ user_id: linkedUserId })
          .eq('id', contact.id);
        console.log('[webhook] auto-linked contact to user:', linkedUserId);
      }
    }

    // ── 5. Get or create conversation (race-condition-safe) ───
    const messagePreview = payload.hasMedia
      ? `[${payload.type === 'ptt' ? 'Audio' : payload.type.charAt(0).toUpperCase() + payload.type.slice(1)}]${payload.body ? ` ${payload.body}` : ''}`
      : (payload.body || '');

    // Use array + limit(1) to never fail when >1 rows exist (maybeSingle() throws on multiple rows)
    const { data: convRows } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, bot_active, unread_count')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: true })
      .limit(1);

    const existingConv = convRows?.[0] ?? null;

    let conversationId: string;
    let botActive = true;

    if (existingConv) {
      conversationId = existingConv.id;
      botActive = existingConv.bot_active;
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
      // INSERT ... ON CONFLICT (contact_id) DO NOTHING — atomic, no race condition
      // The UNIQUE constraint on contact_id prevents duplicate conversations.
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('whatsapp_conversations')
        .upsert(
          {
            contact_id: contact.id,
            status: 'open',
            bot_active: true,
            last_message_at: new Date().toISOString(),
            last_message_preview: messagePreview.slice(0, 100),
            unread_count: 1,
          },
          { onConflict: 'contact_id', ignoreDuplicates: false }
        )
        .select('id, bot_active')
        .single();

      if (convError || !newConv) {
        console.error('[webhook] conversation upsert error:', JSON.stringify(convError));
        return NextResponse.json({ autoRespond: true }, { status: 500 });
      }
      conversationId = newConv.id;
      botActive = newConv.bot_active;
    }

    // ── 6. Media upload ───────────────────────────────────────
    let mediaUrl: string | null = null;

    if (payload.hasMedia && payload.media?.data) {
      try {
        const buffer = Buffer.from(payload.media.data, 'base64');
        const ext = payload.media.mimetype.split('/')[1]?.split(';')[0] || 'bin';
        const filename = payload.media.filename || `${payload.messageId}.${ext}`;
        const storagePath = `${conversationId}/${filename}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('whatsapp-media')
          .upload(storagePath, buffer, { contentType: payload.media.mimetype, upsert: false });

        if (!uploadError) {
          const { data: urlData } = await supabaseAdmin.storage
            .from('whatsapp-media')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
          mediaUrl = urlData?.signedUrl || null;
        }
      } catch (mediaErr) {
        console.error('[webhook] media upload error:', mediaErr);
      }
    }

    // ── 7. Insert message ─────────────────────────────────────
    const msgType = payload.type === 'chat' ? 'text' : (
      ['image', 'video', 'document', 'audio', 'ptt', 'sticker'].includes(payload.type)
        ? payload.type : 'unknown'
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
    }

    return NextResponse.json({ autoRespond: botActive });
  } catch (err) {
    console.error('[webhook] UNHANDLED ERROR:', err);
    return NextResponse.json({ autoRespond: true }, { status: 500 });
  }
}
