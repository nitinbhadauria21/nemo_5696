import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, resolveSupabaseAnonKey, resolveSupabaseUrl } from './config';

/** Server-only Supabase client with service role (cron ingestion). Never expose to browser. */
export function createAdminClient() {
  const url = resolveSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || '';
  if (!isSupabaseConfigured() || !url || !serviceKey || serviceKey.length < 20) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Prefer anon/publishable key for user-scoped clients. */
export function resolveAnonKeyForClient(): string | null {
  return resolveSupabaseAnonKey();
}
