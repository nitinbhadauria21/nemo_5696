import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrends } from '@/lib/trends/store';
import { deriveVelocitiesFromSnapshots, type SnapshotPoint } from '@/lib/signals/briefScoring';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const admin = createAdminClient();
    const userClient = await createClient();
    const reader = admin || userClient;
    if (reader) {
      const { data } = await reader
        .from('trend_snapshots')
        .select('*')
        .eq('trend_id', id)
        .order('collected_at', { ascending: true })
        .limit(200);

      if (data?.length) {
        const allPoints: SnapshotPoint[] = data.map((p) => ({
          at: String(p.collected_at),
          score: Number(p.nemo_score ?? p.score ?? 0),
          mentions: Number(p.mentions_last_24h ?? 0),
          creatorVelocity: Number(p.creator_velocity_score ?? 0),
        }));

        const windows = [1, 6, 12, 24, 48, 72];
        const now = Date.now();
        const series = windows.map((h) => {
          const cutoff = now - h * 3600 * 1000;
          const points = allPoints.filter((d) => Date.parse(d.at) >= cutoff);
          const derived = deriveVelocitiesFromSnapshots(points);
          return {
            windowHours: h,
            points,
            velocities: {
              mention: derived.mentionVelocity,
              creator: derived.creatorVelocity,
              score: derived.scoreVelocity,
              acceleration: derived.acceleration,
            },
          };
        });

        const derivedAll = deriveVelocitiesFromSnapshots(allPoints);
        const first = data[0];
        const last = data[data.length - 1];
        return NextResponse.json({
          trendId: id,
          series,
          peakScore: derivedAll.peakScore,
          peakVelocity: derivedAll.peakVelocity,
          peakAcceleration: derivedAll.peakAcceleration,
          velocities: {
            mention: derivedAll.mentionVelocity,
            creator: derivedAll.creatorVelocity,
            score: derivedAll.scoreVelocity,
            acceleration: derivedAll.acceleration,
          },
          firstDetectedAt: first?.collected_at,
          latestAt: last?.collected_at,
          durationHours: first
            ? (Date.parse(String(last.collected_at)) - Date.parse(String(first.collected_at))) /
              3600000
            : 0,
          snapshotCount: data.length,
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
  const points: SnapshotPoint[] = spark.map((score, i) => ({
    at: new Date(Date.now() - (spark.length - i) * 3600 * 1000).toISOString(),
    score,
    mentions: trend.mentions24h,
    creatorVelocity: trend.cvs,
  }));
  const derived = deriveVelocitiesFromSnapshots(points);
  return NextResponse.json({
    trendId: id,
    series: [
      {
        windowHours: 72,
        points,
        velocities: {
          mention: derived.mentionVelocity,
          creator: derived.creatorVelocity,
          score: derived.scoreVelocity,
          acceleration: derived.acceleration,
        },
      },
    ],
    peakScore: Math.max(...spark, trend.nemoScore, derived.peakScore),
    peakVelocity: derived.peakVelocity || trend.velocity,
    peakAcceleration: derived.peakAcceleration || trend.acceleration || 0,
    velocities: {
      mention: derived.mentionVelocity,
      creator: derived.creatorVelocity || trend.velocity,
      score: derived.scoreVelocity,
      acceleration: derived.acceleration || trend.acceleration || 0,
    },
    firstDetectedAt: trend.firstDetectedAt,
    latestAt: trend.latestActivityAt || trend.firstDetectedAt,
    durationHours: (Date.now() - Date.parse(trend.firstDetectedAt || '')) / 3600000,
    snapshotCount: points.length,
  });
}
