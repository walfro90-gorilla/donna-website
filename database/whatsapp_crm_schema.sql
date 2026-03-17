-- ============================================================
-- WhatsApp CRM Schema — Donna Food Delivery
-- Execute once in Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CONTACTS — One record per unique WhatsApp phone number
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  phone            text        UNIQUE NOT NULL,  -- e.g. "521XXXXXXXXXX@c.us"
  name             text,
  profile_photo_url text,
  first_seen_at    timestamptz DEFAULT now(),
  last_seen_at     timestamptz,
  metadata         jsonb       DEFAULT '{}'
);

-- ────────────────────────────────────────────────────────────
-- 2. CONVERSATIONS — One thread per contact
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id          uuid        REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  status              text        DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved')),
  bot_active          bool        DEFAULT true,
  bot_paused_by       uuid        REFERENCES users(id) ON DELETE SET NULL,
  bot_paused_at       timestamptz,
  assigned_to         uuid        REFERENCES users(id) ON DELETE SET NULL,
  last_message_at     timestamptz,
  last_message_preview text,
  unread_count        int         DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. MESSAGES — Every inbound and outbound message
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid        REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id   text        UNIQUE,  -- WhatsApp internal message ID (dedup)
  direction       text        NOT NULL
    CHECK (direction IN ('inbound', 'outbound')),
  type            text        DEFAULT 'text'
    CHECK (type IN ('text', 'image', 'video', 'document', 'audio', 'ptt', 'sticker', 'unknown')),
  body            text,            -- Text content or caption for media
  media_url       text,            -- Signed URL or path in Supabase Storage
  media_mimetype  text,
  media_filename  text,
  status          text        DEFAULT 'sent'
    CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_by         uuid        REFERENCES users(id) ON DELETE SET NULL,  -- NULL if bot/inbound
  created_at      timestamptz DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wa_conversations_contact
  ON whatsapp_conversations(contact_id);

CREATE INDEX IF NOT EXISTS idx_wa_conversations_last_msg
  ON whatsapp_conversations(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_wa_messages_conv_time
  ON whatsapp_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_wa_messages_direction
  ON whatsapp_messages(direction);

-- ────────────────────────────────────────────────────────────
-- 5. updated_at trigger for conversations
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_whatsapp_conversation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wa_conv_updated_at ON whatsapp_conversations;
CREATE TRIGGER trg_wa_conv_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_conversation_updated_at();

-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY — Only admins can access CRM data
-- ────────────────────────────────────────────────────────────
ALTER TABLE whatsapp_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages      ENABLE ROW LEVEL SECURITY;

-- Contacts: admins full access
DROP POLICY IF EXISTS "admin_contacts_all" ON whatsapp_contacts;
CREATE POLICY "admin_contacts_all" ON whatsapp_contacts
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Conversations: admins full access
DROP POLICY IF EXISTS "admin_conversations_all" ON whatsapp_conversations;
CREATE POLICY "admin_conversations_all" ON whatsapp_conversations
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Messages: admins full access
DROP POLICY IF EXISTS "admin_messages_all" ON whatsapp_messages;
CREATE POLICY "admin_messages_all" ON whatsapp_messages
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Service role bypass (used in API routes with service key)
-- No policy needed — service role bypasses RLS automatically

-- ────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET for WhatsApp media
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  false,
  52428800,  -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/3gp', 'video/quicktime',
    'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/webm',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: admins can read/write
DROP POLICY IF EXISTS "admin_wa_media_select" ON storage.objects;
CREATE POLICY "admin_wa_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'whatsapp-media'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "admin_wa_media_insert" ON storage.objects;
CREATE POLICY "admin_wa_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'whatsapp-media'
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ────────────────────────────────────────────────────────────
-- 8. REALTIME — Enable for CRM live updates
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_conversations;

-- ────────────────────────────────────────────────────────────
-- Verification query (run after migration)
-- ────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name LIKE 'whatsapp_%';
