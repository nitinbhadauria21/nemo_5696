import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { trackEvent } from '@/lib/analytics/track';
import { resolveUserId } from '@/lib/api/requireUser';

const memoryBookmarks = new Map<string, Set<string>>();

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (isSupabaseConfigured() && !demo) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ ok: true });
    await supabase.from('trend_bookmarks').delete().eq('user_id', userId).eq('trend_id', id);
  } else {
    if (!memoryBookmarks.has(userId)) memoryBookmarks.set(userId, new Set());
    memoryBookmarks.get(userId)!.delete(id);
  }

  if (!demo) {
    await trackEvent({
      userId,
      eventName: 'bookmark.delete',
      eventCategory: 'bookmark',
      properties: { trend_id: id },
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
