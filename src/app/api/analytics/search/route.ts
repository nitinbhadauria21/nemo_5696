import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

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

  const pagePath = body.pagePath ?? body.page_path ?? null;
  const resultCount =
    typeof body.resultCount === 'number' ? body.resultCount : (body.result_count ?? null);
  const source =
    typeof body.source === 'string' && body.source
      ? String(body.source).slice(0, 40)
      : 'global';
  const filters =
    body.filters && typeof body.filters === 'object' && !Array.isArray(body.filters)
      ? body.filters
      : {};

  await supabase.from('search_queries').insert({
    user_id: userId,
    query,
    page_path: pagePath,
    result_count: resultCount,
    source,
    filters,
  });

  if (userId) {
    await trackEvent({
      userId,
      eventName: 'search.keyword',
      eventCategory: 'product',
      properties: {
        query: query.slice(0, 200),
        page_path: pagePath,
        result_count: resultCount,
        source,
        filters,
      },
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
