// lib/hooks/useSupabase.ts
import { createClient } from '@/lib/supabase/client';
import { useRef } from 'react';

// Singleton pattern para el cliente Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function useSupabase() {
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!clientRef.current) {
    if (!supabaseInstance) {
      supabaseInstance = createClient();
    }
    clientRef.current = supabaseInstance;
  }

  return clientRef.current;
}