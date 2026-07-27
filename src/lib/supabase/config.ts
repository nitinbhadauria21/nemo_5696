/**
 * Returns true when Supabase public env looks configured (not empty / placeholder).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) return false;
  if (
    url.includes('your-project') ||
    url.includes('placeholder') ||
    url.includes('example') ||
    url.includes('dummy.supabase')
  ) {
    return false;
  }
  if (
    key.includes('your-anon') ||
    key.includes('dummykey') ||
    key.includes('placeholder') ||
    key.length < 20
  ) {
    return false;
  }
  return true;
}
