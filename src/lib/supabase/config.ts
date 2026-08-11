/**
 * Returns true when Supabase public env looks configured (not empty / placeholder).
 * Accepts both legacy JWT keys and newer sb_publishable_ / URL fallbacks.
 */
export function resolveSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ''
  );
}

export function resolveSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

export function isSupabaseConfigured(): boolean {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseAnonKey();
  if (!url || !key) return false;
  if (
    url.includes('your-project') ||
    url.includes('placeholder') ||
    url.includes('example') ||
    url.includes('dummy.supabase') ||
    url === '[SENSITIVE]'
  ) {
    return false;
  }
  if (
    key.includes('your-anon') ||
    key.includes('dummykey') ||
    key.includes('placeholder') ||
    key === '[SENSITIVE]' ||
    key.length < 20
  ) {
    return false;
  }
  return true;
}
