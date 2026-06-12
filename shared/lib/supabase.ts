import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Lazily retrieves the public Supabase client instance.
 * Ensures the app does not crash at module load time if environment variables are missing.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      // Return a dummy client in development or throw, wait but throwing prevents server startup crash
      // if it's only called on action. If we throw on access, it is perfectly safe.
      throw new Error(
        'Supabase URL or Anon Key is missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (urlEndpoint, options) => {
          // Robust client-side retry mechanism for unstable network connections
          const fetchWithRetry = async (retries = 3, delay = 1000): Promise<Response> => {
            try {
              return await fetch(urlEndpoint, options);
            } catch (err) {
              if (retries <= 0) {
                throw err;
              }
              await new Promise((resolve) => setTimeout(resolve, delay));
              return fetchWithRetry(retries - 1, delay * 2);
            }
          };
          return fetchWithRetry();
        },
      },
    });
  }
  return supabaseInstance;
}

/**
 * Lazily retrieves the Supabase Service Role (Admin) client instance.
 * Bypasses RLS - FOR SERVER-SIDE USE ONLY.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
      throw new Error(
        'Supabase URL or Service Role Key is missing. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
    
    supabaseAdminInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (urlEndpoint, options) => {
          const fetchWithRetry = async (retries = 3, delay = 1000): Promise<Response> => {
            try {
              return await fetch(urlEndpoint, options);
            } catch (err) {
              if (retries <= 0) {
                throw err;
              }
              await new Promise((resolve) => setTimeout(resolve, delay));
              return fetchWithRetry(retries - 1, delay * 2);
            }
          };
          return fetchWithRetry();
        },
      },
    });
  }
  return supabaseAdminInstance;
}
