// lib/auth/client.ts
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseClientManager {
  private static instance: SupabaseClient | null = null;
  
  static getInstance(): SupabaseClient {
    if (!this.instance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }

      this.instance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'donna-auth',
        },
      });
    }
    
    return this.instance;
  }
  
  static reset() {
    this.instance = null;
  }
}

export const supabase = SupabaseClientManager.getInstance();