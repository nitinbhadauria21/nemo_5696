import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

const memoryBookmarks = new Map<string, Set<string>>();

function userKey(userId: string) {
  if (!memoryBookmarks.has(userId)) memoryBookmarks.set(userId, new Set());
  return memoryBookmarks.get(userId)!;
}

export async function GET() {
  const userId = (await getAuthUserId()) || 'demo';
  if (isSupabaseConfigured() && userId !== 'demo') {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ bookmarks: [...userKey(userId)] });
    const { data } = await supabase.from('trend_bookmarks').select('trend_id').eq('user_id', userId);
    return NextResponse.json({ bookmarks: (data ?? []).map((r) => r.trend_id) });
  }
  return NextResponse.json({ bookmarks: [...userKey(userId)] });
}

export async function POST(request: NextRequest) {
  const userId = (await getAuthUserId()) || 'demo';
  const { trendId } = await request.json();
  if (!trendId) return NextResponse.json({ error: 'trendId required' }, { status: 400 });

  if (isSupabaseConfigured() && userId !== 'demo') {
    const supabase = await createClient();
    if (!supabase) {
      userKey(userId).add(trendId);
      return NextResponse.json({ ok: true });
    }
    await supabase.from('trend_bookmarks').upsert({ user_id: userId, trend_id: trendId });
  } else {
    userKey(userId).add(trendId);
  }

  if (userId !== 'demo') {
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
