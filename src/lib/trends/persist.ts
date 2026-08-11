import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrendItem, TrendPlatform } from '@/lib/mockData';

/** DB platform_enum values (incl. google_trends + youtube_shorts). */
type DbPlatform =
  | 'instagram'
  | 'youtube'
  | 'youtube_shorts'
  | 'google_trends'
  | 'reddit'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'facebook';

const NICHE_ENUM = new Set([
  'AI',
  'fitness',
  'finance',
  'fashion',
  'gaming',
  'movies',
  'education',
  'startups',
  'travel',
  'food',
  'sports',
  'marketing',
  'productivity',
  'business',
  'other',
]);

/** Map UI category / free-text niche → trend_niche_enum. */
export function mapCategoryToNiche(category: string | undefined | null): string {
  const raw = String(category || 'other').trim();
  if (NICHE_ENUM.has(raw)) return raw;

  const c = raw.toLowerCase();
  if (c === 'ai & tech' || c === 'ai' || c.includes('tech') || c.includes('artificial'))
    return 'AI';
  if (c.includes('market')) return 'marketing';
  if (c.includes('sport')) return 'sports';
  if (c.includes('game')) return 'gaming';
  if (c.includes('financ') || c.includes('crypto') || c.includes('invest')) return 'finance';
  if (c.includes('business') || c.includes('startup'))
    return c.includes('startup') ? 'startups' : 'business';
  if (c.includes('productiv')) return 'productivity';
  if (c.includes('fit') || c.includes('gym') || c.includes('health')) return 'fitness';
  if (c.includes('fashion') || c.includes('beauty') || c.includes('style')) return 'fashion';
  if (c.includes('food') || c.includes('cook') || c.includes('recipe')) return 'food';
  if (c.includes('travel')) return 'travel';
  if (c.includes('educat') || c.includes('learn')) return 'education';
  if (c.includes('movie') || c.includes('film') || c.includes('entertainment')) return 'movies';
  return 'other';
}

export function mapUiPlatformToDb(platform: TrendPlatform | string): DbPlatform {
  if (platform === 'google') return 'google_trends';
  if (platform === 'youtube_shorts') return 'youtube_shorts';
  return platform as DbPlatform;
}

function trendAgeHours(firstDetectedAt: string | undefined): number {
  if (!firstDetectedAt) return 0;
  const ms = Date.parse(firstDetectedAt);
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, (Date.now() - ms) / 3600000);
}

function mapTrendToRecord(t: TrendItem) {
  const statusMap: Record<string, string> = {
    hot: 'PEAKING',
    rising: 'RISING',
    fading: 'DECLINING',
  };
  const platforms = (t.platforms?.length ? t.platforms : ['google']).map(mapUiPlatformToDb);
  const geo =
    t.geoRegions && t.geoRegions.length
      ? t.geoRegions.map((g) => String(g).toUpperCase())
      : ['GLOBAL'];

  return {
    trend_id: t.id,
    topic_text: t.title,
    platform: platforms[0],
    niche: mapCategoryToNiche(t.category),
    first_detected_at: t.firstDetectedAt,
    collected_at: new Date().toISOString(),
    trend_age_hours: trendAgeHours(t.firstDetectedAt),
    creator_velocity_score: t.cvs,
    spike_score: t.ss,
    cross_platform_score: t.cps,
    freshness_score: t.freshness,
    freshness_multiplier: t.freshnessMultiplier,
    nemo_score: t.nemoScore,
    status: statusMap[t.status] ?? 'RISING',
    platforms_present: platforms,
    geo_regions: geo,
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
