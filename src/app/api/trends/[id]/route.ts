import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getTrends } from '@/lib/trends/store';
import { MOCK_TRENDS } from '@/lib/mockData';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getTrends({ refresh: false });
  const trend = result.trends.find((t) => t.id === id) ?? MOCK_TRENDS.find((t) => t.id === id);
  if (!trend) {
    return NextResponse.json({ error: 'Trend not found' }, { status: 404 });
  }
  return NextResponse.json({ trend, source: result.source });
}
