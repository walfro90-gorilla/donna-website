// lib/supabase/client.ts
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// NO usar singleton - crear nueva instancia cada vez para evitar bloqueos
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }

  // Crear nueva instancia cada vez con configuración simplificada
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Desactivar para evitar conflictos
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
  });
}
