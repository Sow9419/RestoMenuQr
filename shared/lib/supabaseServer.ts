import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withRetry } from './supabase';

/**
 * Creates a server-side Supabase client for Server Components, Layouts, or Server Actions.
 * Wraps query operations with retry/timeout for network resilience.
 * Readily parses cookies from next/headers to handle active sessions securely.
 */
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || !url.startsWith('http')) {
    throw new Error(
      'Supabase URL is missing or invalid. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be valid HTTP/HTTPS URLs.'
    );
  }

  const cookieStore = await cookies();

  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from Server Components
        }
      },
    },
  });

  const originalFrom = client.from.bind(client);
  (client as any).from = (table: string) => {
    const qb = originalFrom(table);
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
