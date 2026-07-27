import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrendItem } from '@/lib/mockData';

function mapTrendToRecord(t: TrendItem) {
  const statusMap: Record<string, string> = {
    hot: 'PEAKING',
    rising: 'RISING',
    fading: 'DECLINING',
  };
  return {
    trend_id: t.id,
    topic_text: t.title,
    platform: t.platforms[0] === 'google' ? 'google_trends' : t.platforms[0],
    niche: 'other',
    first_detected_at: t.firstDetectedAt,
    collected_at: new Date().toISOString(),
    trend_age_hours: 2,
    creator_velocity_score: t.cvs,
    spike_score: t.ss,
    cross_platform_score: t.cps,
    freshness_score: t.freshness,
    freshness_multiplier: t.freshnessMultiplier,
    nemo_score: t.nemoScore,
    status: statusMap[t.status] ?? 'RISING',
    platforms_present: t.platforms.map((p) => (p === 'google' ? 'google_trends' : p)),
    mentions_last_24h: t.mentions24h,
    mentions_prev_24h: t.mentionsPrev24h,
    creators_last_6h: t.creatorsLast6h,
    creators_last_24h: t.creatorsLast24h,
    creators_last_72h: t.creatorsLast72h,
    raw_platform_data: t,
  };
}

export async function persistTrendsToSupabase(
  supabase: SupabaseClient,
  trends: TrendItem[]
): Promise<void> {
  if (!trends.length) return;

  const collectedAt = new Date().toISOString();
  const records = trends.map(mapTrendToRecord);

  await supabase.from('trend_records').upsert(records, { onConflict: 'trend_id' });

  const snapshots = trends.map((t) => ({
    trend_id: t.id,
    collected_at: collectedAt,
    nemo_score: t.nemoScore,
    creator_velocity_score: t.cvs,
    spike_score: t.ss,
    cross_platform_score: t.cps,
    mentions_last_24h: t.mentions24h,
    raw_platform_data: t,
  }));

  await supabase.from('trend_snapshots').insert(snapshots);
}
