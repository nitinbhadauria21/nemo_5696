import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * When Supabase is configured, require a real session.
 * When not configured, allow offline 'demo' memory mode.
 */
export async function resolveUserId(): Promise<
  { userId: string; demo: boolean } | { error: NextResponse }
> {
  const userId = await getAuthUserId();
  if (isSupabaseConfigured()) {
    if (!userId) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { userId, demo: false };
  }
  return { userId: userId || 'demo', demo: !userId };
}
