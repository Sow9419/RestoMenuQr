import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient, PostgrestQueryBuilder } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 3;

/**
 * Wraps an async operation with exponential backoff retry and timeout.
 * Implements: 2s → 4s → 8s backoff (max 3 tentatives) per UI_GUIDELINES.md §1.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: { timeout?: number; maxRetries?: number } = {}
): Promise<T> {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = config.maxRetries ?? MAX_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeout}ms (attempt ${attempt + 1}/${maxRetries + 1})`)), timeout)
        ),
      ]);
      return result;
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

/**
 * Creates a Supabase client wrapper with retry/timeout on all query operations.
 */
function createEnhancedClient(client: SupabaseClient): SupabaseClient {
  const originalFrom = client.from.bind(client);
  (client as any).from = (table: string) => {
    const qb = originalFrom(table);
    const originalThen = (qb as any).then?.bind(qb);
    const methodsToWrap = ['select', 'insert', 'update', 'delete', 'upsert'];
    for (const method of methodsToWrap) {
      const original = (qb as any)[method]?.bind(qb);
      if (original) {
        (qb as any)[method] = (...args: any[]) => {
          const builder = original(...args);
          const builderThen = (builder as any).then?.bind(builder);
          if (builderThen) {
            (builder as any).then = (resolve: any, reject: any) =>
              withRetry(() => builderThen(resolve, reject)).catch(reject);
          }
          return builder;
        };
      }
    }
    return qb;
  };
  return client;
}

/**
 * Lazily retrieves the public Supabase client instance with retry/timeout.
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
      supabaseInstance = createEnhancedClient(createBrowserClient(url, anonKey));
    } else {
      supabaseInstance = createEnhancedClient(createClient(url, anonKey));
    }
  }
  return supabaseInstance;
}

/**
 * Lazily retrieves the Supabase Service Role (Admin) client instance with retry/timeout.
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
    
    supabaseAdminInstance = createEnhancedClient(createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }));
  }
  return supabaseAdminInstance;
}
