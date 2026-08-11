import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured, resolveSupabaseAnonKey, resolveSupabaseUrl } from './config';

export async function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    resolveSupabaseUrl() || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolveSupabaseAnonKey() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware will refresh sessions.
          }
        },
      },
    }
  );
}
