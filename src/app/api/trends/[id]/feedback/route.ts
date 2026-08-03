import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveUserId } from '@/lib/api/requireUser';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;
  if (demo || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { id: trendId } = await params;
  const body = await request.json();
  const rating = body.rating as string;
  if (!['useful', 'not_useful', 'dismissed'].includes(rating)) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const { error } = await supabase.from('trend_feedback').upsert(
    {
      user_id: userId,
      trend_id: trendId,
      rating,
      note: body.note ?? null,
    },
    { onConflict: 'user_id,trend_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
