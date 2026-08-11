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

/**
 * Drop records that were not refreshed in this ingest and are older than maxAgeHours.
 * Keeps the dashboard from showing stale seed / dead-platform rows forever.
 * Never runs when the current batch is empty (failed collectors must not wipe live data).
 */
export async function purgeStaleTrendRecords(
  supabase: SupabaseClient,
  keepTrendIds: string[],
  maxAgeHours = 72
): Promise<number> {
  if (!keepTrendIds.length) return 0;
  const cutoff = new Date(Date.now() - maxAgeHours * 3600 * 1000).toISOString();
  const keep = new Set(keepTrendIds);

  const { data: stale, error } = await supabase
    .from('trend_records')
    .select('trend_id')
    .lt('collected_at', cutoff)
    .limit(500);

  if (error) {
    console.error('purgeStaleTrendRecords select failed', error.message);
    return 0;
  }

  const toDelete = (stale ?? []).map((r) => String(r.trend_id)).filter((id) => !keep.has(id));
  if (!toDelete.length) return 0;

  const { error: delErr } = await supabase.from('trend_records').delete().in('trend_id', toDelete);
  if (delErr) {
    console.error('purgeStaleTrendRecords delete failed', delErr.message);
    return 0;
  }
  return toDelete.length;
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

  await purgeStaleTrendRecords(
    supabase,
    trends.map((t) => t.id),
    Number(process.env.TREND_STALE_MAX_AGE_HOURS || 72)
  );
}
