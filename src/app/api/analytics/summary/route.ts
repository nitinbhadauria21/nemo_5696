import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserId } from '@/lib/api/auth';

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const CATEGORY_COLORS = [
  'var(--primary)',
  'var(--accent)',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#64748b',
];

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const range = request.nextUrl.searchParams.get('range') || '30d';
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      range,
      kpis: { events: 0, aiCalls: 0, bookmarks: 0, queueActions: 0, activeDays: 0 },
      byDay: [],
      byCategory: [],
      topEvents: [],
      source: 'unavailable',
    });
  }

  const { data: events } = await supabase
    .from('user_events')
    .select('event_name, event_category, created_at, page_path')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(5000);

  const rows = events ?? [];
  const byDayMap: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDayMap[dayKey(d)] = 0;
  }

  const byCategory: Record<string, number> = {};
  const byName: Record<string, number> = {};
  let aiCalls = 0;
  let bookmarks = 0;
  let queueActions = 0;
  const activeDaySet = new Set<string>();

  for (const e of rows) {
    const key = dayKey(new Date(e.created_at));
    if (key in byDayMap) byDayMap[key] += 1;
    activeDaySet.add(key);

    const cat = e.event_category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    byName[e.event_name] = (byName[e.event_name] || 0) + 1;

    if (cat === 'ai' || e.event_name.startsWith('ai.')) aiCalls += 1;
    if (cat === 'bookmark' || e.event_name.startsWith('bookmark.')) bookmarks += 1;
    if (cat === 'queue' || e.event_name.startsWith('queue.')) queueActions += 1;
  }

  const categoryEntries = Object.entries(byCategory);
  const categoryTotal = categoryEntries.reduce((s, [, c]) => s + c, 0) || 1;

  return NextResponse.json({
    range,
    kpis: {
      events: rows.length,
      aiCalls,
      bookmarks,
      queueActions,
      activeDays: activeDaySet.size,
    },
    byDay: Object.entries(byDayMap).map(([date, count]) => ({
      date: date.slice(5),
      count,
    })),
    byCategory: categoryEntries.map(([name, count], i) => ({
      name,
      count,
      value: Math.round((count / categoryTotal) * 100),
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })),
    topEvents: Object.entries(byName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count })),
    source: 'supabase',
  });
}
