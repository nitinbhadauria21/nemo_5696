import { NextRequest, NextResponse } from 'next/server';
import { getTrends, getRelatedTrends } from '@/lib/trends/store';
import { MOCK_TRENDS } from '@/lib/mockData';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getTrends({ refresh: false });
  let trend = result.trends.find((t) => t.id === id);
  if (!trend && !isSupabaseConfigured()) {
    trend = MOCK_TRENDS.find((t) => t.id === id);
  }
  if (!trend) {
    return NextResponse.json({ error: 'Trend not found' }, { status: 404 });
  }
  const related = await getRelatedTrends(id, trend.category, 6);
  return NextResponse.json({ trend, related, source: result.source });
}
