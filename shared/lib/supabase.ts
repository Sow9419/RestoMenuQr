import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Lazily retrieves the public Supabase client instance.
 * Automatically detects environment (Browser vs Node) via @supabase/ssr.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !anonKey || !url.startsWith('http')) {
      throw new Error(
        'Supabase URL is missing or invalid. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    
    if (typeof window !== 'undefined') {
      // Browser Environment: uses cookies automatically for hydration
      supabaseInstance = createBrowserClient(url, anonKey);
    } else {
      // Server-side non-Next Context or initialization
      supabaseInstance = createClient(url, anonKey);
    }
  }
  return supabaseInstance;
}

/**
 * Lazily retrieves the Supabase Service Role (Admin) client instance.
 * Bypasses RLS - FOR SERVER-SIDE USE ONLY.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() cannot be called from the browser.');
  }

  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey || !url.startsWith('http')) {
      throw new Error(
        'Supabase URL or Service Key is missing.'
      );
    }
    
    supabaseAdminInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminInstance;
}
