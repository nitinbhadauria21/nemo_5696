import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTrends } from '@/lib/trends/store';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from('trend_snapshots')
        .select('*')
        .eq('trend_id', id)
        .order('captured_at', { ascending: true })
        .limit(200);

      if (data?.length) {
        const windows = [1, 6, 12, 24, 48, 72];
        const now = Date.now();
        const series = windows.map((h) => {
          const cutoff = now - h * 3600 * 1000;
          const points = data.filter((d) => Date.parse(String(d.captured_at)) >= cutoff);
          return {
            windowHours: h,
            points: points.map((p) => ({
              at: p.captured_at,
              score: p.nemo_score ?? p.score ?? 0,
              mentions: p.mentions_last_24h ?? 0,
            })),
          };
        });

        const scores = data.map((d) => Number(d.nemo_score ?? d.score ?? 0));
        const peakScore = scores.length ? Math.max(...scores) : 0;
        const first = data[0];
        const last = data[data.length - 1];
        return NextResponse.json({
          trendId: id,
          series,
          peakScore,
          firstDetectedAt: first?.captured_at,
          latestAt: last?.captured_at,
          durationHours: first
            ? (Date.parse(String(last.captured_at)) - Date.parse(String(first.captured_at))) /
              3600000
            : 0,
        });
      }
    }
  } catch {
    // fall through
  }

  // Fallback: derive sparse history from current trend
  const result = await getTrends({
    refresh: false,
    filters: { timeframeHours: 168, neverBlankTopK: false },
  });
  const trend = result.trends.find((t) => t.id === id);
  if (!trend) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const spark = trend.sparklineData?.length ? trend.sparklineData : [trend.nemoScore];
  return NextResponse.json({
    trendId: id,
    series: [
      {
        windowHours: 72,
        points: spark.map((score, i) => ({
          at: new Date(Date.now() - (spark.length - i) * 3600 * 1000).toISOString(),
          score,
          mentions: trend.mentions24h,
        })),
      },
    ],
    peakScore: Math.max(...spark, trend.nemoScore),
    firstDetectedAt: trend.firstDetectedAt,
    latestAt: trend.latestActivityAt || trend.firstDetectedAt,
    durationHours: (Date.now() - Date.parse(trend.firstDetectedAt || '')) / 3600000,
  });
}
