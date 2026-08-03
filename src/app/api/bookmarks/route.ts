import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { trackEvent } from '@/lib/analytics/track';
import { resolveUserId } from '@/lib/api/requireUser';

const memoryBookmarks = new Map<string, Set<string>>();

function userKey(userId: string) {
  if (!memoryBookmarks.has(userId)) memoryBookmarks.set(userId, new Set());
  return memoryBookmarks.get(userId)!;
}

export async function GET() {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (isSupabaseConfigured() && !demo) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ bookmarks: [] });
    const { data } = await supabase
      .from('trend_bookmarks')
      .select('trend_id')
      .eq('user_id', userId);
    return NextResponse.json({ bookmarks: (data ?? []).map((r) => r.trend_id) });
  }
  return NextResponse.json({ bookmarks: [...userKey(userId)] });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  const { trendId } = await request.json();
  if (!trendId) return NextResponse.json({ error: 'trendId required' }, { status: 400 });

  if (isSupabaseConfigured() && !demo) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    await supabase.from('trend_bookmarks').upsert({ user_id: userId, trend_id: trendId });
  } else {
    userKey(userId).add(trendId);
  }

  if (!demo) {
    await trackEvent({
      userId,
      eventName: 'bookmark.create',
      eventCategory: 'bookmark',
      properties: { trend_id: trendId },
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
