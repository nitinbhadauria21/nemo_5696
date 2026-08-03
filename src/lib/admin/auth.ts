import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Admin authorization: authenticated Supabase user with profiles.is_admin = true.
 * Does not trust cookies for authorization.
 */
export async function requireAdminSession(): Promise<true | NextResponse> {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();
    if (data?.is_admin === true) return true;
  }

  // Fallback: service role read if RLS blocks is_admin column for self-select
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
    if (data?.is_admin === true) return true;
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function isAdminCookie(_requestCookies: {
  get: (name: string) => { value: string } | undefined;
}) {
  // Cookie is no longer authorization — always false for middleware shortcuts
  return false;
}
