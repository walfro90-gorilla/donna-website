// lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  // Define tus variables de entorno en un archivo .env.local
  // para mantener tus claves seguras.
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
