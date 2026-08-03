import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, source: 'offline' });
  }

  const userId = await getAuthUserId();
  const body = await request.json();
  const query = (body.query || '').trim();
  if (query.length < 2) {
    return NextResponse.json({ error: 'query too short' }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: true });

  await supabase.from('search_queries').insert({
    user_id: userId,
    query,
    page_path: body.pagePath ?? body.page_path ?? null,
    result_count: typeof body.resultCount === 'number' ? body.resultCount : body.result_count ?? null,
  });

  return NextResponse.json({ ok: true });
}
