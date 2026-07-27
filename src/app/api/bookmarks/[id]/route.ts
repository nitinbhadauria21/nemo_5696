import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';

const memoryBookmarks = new Map<string, Set<string>>();

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = (await getAuthUserId()) || 'demo';

  if (isSupabaseConfigured() && userId !== 'demo') {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ ok: true });
    await supabase.from('trend_bookmarks').delete().eq('user_id', userId).eq('trend_id', id);
  } else {
    if (!memoryBookmarks.has(userId)) memoryBookmarks.set(userId, new Set());
    memoryBookmarks.get(userId)!.delete(id);
  }
  return NextResponse.json({ ok: true });
}
