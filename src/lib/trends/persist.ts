import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrendItem, TrendPlatform, TrendTopContent } from '@/lib/mockData';
import {
  buildWhyTrending,
  clusterTrends,
  isEvergreenTopic,
  normalizeClusterKey,
  pickCanonical,
} from '@/lib/signals/briefScoring';
import { normalizeUiNiche } from './publicCopy';

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

/** Product rule: never persist evergreen content older than 30 days. */
const MAX_PERSIST_AGE_HOURS = 30 * 24;

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

  const uiNiches = Array.from(
    new Set(
      (t.niches?.length ? t.niches : [t.category || 'AI'])
        .map((n) => normalizeUiNiche(String(n), t.title))
        .filter((n) => n && n.toLowerCase() !== 'other')
    )
  );
  const uiCategory = normalizeUiNiche(t.category || uiNiches[0] || 'AI', t.title);
  const why =
    t.whyTrending?.length && t.whyTrending.length > 0
      ? t.whyTrending
      : buildWhyTrending({
          velocity: t.velocity,
          spike: t.ss,
          platforms: t.platforms?.length,
          freshness: t.freshness,
          breakout: t.breakoutBoolean || (t.breakoutScore ?? 0) >= 70,
          creators: t.creatorsCount,
          acceleration: t.acceleration,
          geoSpread: t.geoSpreadScore || t.geoRegions?.length,
        });

  // Soft down-rank evergreen niche-name topics in stored score
  const evergreenPenalty = isEvergreenTopic(t.title) ? 0.55 : 1;
  const storedScore = Math.round(t.nemoScore * evergreenPenalty * 100) / 100;

  return {
    trend_id: t.id,
    topic_text: t.title,
    platform: platforms[0],
    niche: mapCategoryToNiche(uiCategory),
    niches: uiNiches.length ? uiNiches : [uiCategory],
    first_detected_at: t.firstDetectedAt,
    collected_at: new Date().toISOString(),
    last_seen_at: t.latestActivityAt || new Date().toISOString(),
    lifecycle_status:
      t.lifecycle ||
      (t.status === 'hot' ? 'breakout' : t.status === 'fading' ? 'fading' : 'rising'),
    trend_age_hours: trendAgeHours(t.firstDetectedAt),
    creator_velocity_score: t.cvs,
    spike_score: t.ss,
    cross_platform_score: t.cps,
    freshness_score: t.freshness,
    freshness_multiplier: t.freshnessMultiplier,
    velocity_score: t.velocity ?? t.ss,
    acceleration_score: t.acceleration ?? 0,
    engagement_score: t.engagementScore ?? 0,
    novelty_score: t.noveltyScore ?? 0,
    persistence_score: t.persistenceScore ?? 0,
    breakout_score: t.breakoutScore ?? 0,
    confidence_score: t.confidenceScore ?? 0,
    geo_spread_score: t.geoSpreadScore ?? geo.length,
    nemo_score: storedScore,
    cluster_id: t.clusterId || null,
    why_trending: why,
    status: statusMap[t.status] ?? 'RISING',
    platforms_present: platforms,
    geo_regions: geo,
    mentions_last_24h: t.mentions24h,
    mentions_prev_24h: t.mentionsPrev24h,
    creators_last_6h: t.creatorsLast6h,
    creators_last_24h: t.creatorsLast24h,
    creators_last_72h: t.creatorsLast72h,
    raw_platform_data: { ...t, whyTrending: why, clusterId: t.clusterId, nemoScore: storedScore },
  };
}

async function persistClusters(
  supabase: SupabaseClient,
  trends: TrendItem[]
): Promise<Map<string, string>> {
  /** trend_id → cluster_id */
  const assignment = new Map<string, string>();
  const groups = clusterTrends(trends);
  const now = new Date().toISOString();
  const clusterRows: Array<Record<string, unknown>> = [];

  for (const [key, members] of groups) {
    if (members.length < 1) continue;
    const canonical = pickCanonical(members);
    const clusterId = `cl_${key}`.slice(0, 120);
    const aliases = members.map((m) => m.title).filter((t) => t !== canonical.title);
    const niches = Array.from(
      new Set(members.flatMap((m) => (m.niches?.length ? m.niches : [m.category])))
    );
    for (const m of members) assignment.set(m.id, clusterId);
    clusterRows.push({
      cluster_id: clusterId,
      canonical_title: canonical.title,
      aliases,
      keywords: [key],
      niche: mapCategoryToNiche(canonical.category),
      niches,
      first_seen_at:
        members
          .map((m) => m.firstDetectedAt)
          .filter(Boolean)
          .sort()[0] || now,
      last_seen_at: now,
      member_count: members.length,
      peak_score: Math.max(...members.map((m) => m.nemoScore)),
    });
  }

  // Singletons still get a cluster id for stable joining
  for (const t of trends) {
    if (assignment.has(t.id)) continue;
    const key = normalizeClusterKey(t.title) || t.id;
    const clusterId = `cl_${key}`.slice(0, 120);
    assignment.set(t.id, clusterId);
    clusterRows.push({
      cluster_id: clusterId,
      canonical_title: t.title,
      aliases: [],
      keywords: [key],
      niche: mapCategoryToNiche(t.category),
      niches: t.niches?.length ? t.niches : [t.category],
      first_seen_at: t.firstDetectedAt || now,
      last_seen_at: now,
      member_count: 1,
      peak_score: t.nemoScore,
    });
  }

  if (clusterRows.length) {
    const { error } = await supabase
      .from('trend_clusters')
      .upsert(clusterRows, { onConflict: 'cluster_id' });
    if (error) console.error('trend_clusters upsert failed', error.message);
  }

  return assignment;
}

function nonemptyString(value?: string | null): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || undefined;
}

function redditPermalinkUrl(permalink: string): string {
  return permalink.startsWith('http') ? permalink : `https://reddit.com${permalink}`;
}

function resolveSourceUrl(
  item: Pick<TrendTopContent, 'url'>,
  trend: Pick<TrendItem, 'sourceUrl'>,
  platformPermalink?: string | null
): string | null {
  return (
    nonemptyString(item.url) ||
    (platformPermalink ? redditPermalinkUrl(platformPermalink) : undefined) ||
    nonemptyString(trend.sourceUrl) ||
    null
  );
}

function withOptionalThumbnail(
  meta: Record<string, unknown>,
  thumbnail?: string
): Record<string, unknown> {
  const thumb = nonemptyString(thumbnail);
  if (thumb) meta.thumbnail = thumb;
  else delete meta.thumbnail;
  return meta;
}

function decodeRedditSourceMeta(item: TrendTopContent): {
  meta: Record<string, unknown>;
  permalink: string | null;
} {
  let meta: Record<string, unknown> = { historical: false };
  let permalink: string | null = null;
  try {
    const parsed = JSON.parse(item.views || '{}') as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const rawPermalink = typeof record.permalink === 'string' ? record.permalink : null;
      const { permalink: _p, ...rest } = record;
      void _p;
      meta = { ...rest, historical: false };
      permalink = rawPermalink;
    }
  } catch {
    // views is a plain display string, not encoded reddit JSON
  }
  return { meta, permalink };
}

/** Pure mapping of trend topContent → trend_sources rows (testable without Supabase). */
export function mapTrendSourceRows(
  trends: TrendItem[],
  collectedAt: string = new Date().toISOString()
): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  for (const t of trends) {
    for (const item of t.topContent || []) {
      const platform = mapUiPlatformToDb(item.platform || t.platforms[0] || 'google');
      if (platform === 'reddit') {
        const decoded = decodeRedditSourceMeta(item);
        rows.push({
          trend_id: t.id,
          platform: 'reddit',
          external_id: item.id,
          title: item.title,
          url: resolveSourceUrl(item, t, decoded.permalink),
          metadata: withOptionalThumbnail(decoded.meta, item.thumbnail),
          collected_at: collectedAt,
        });
        continue;
      }
      rows.push({
        trend_id: t.id,
        platform,
        external_id: item.id,
        title: item.title,
        url: resolveSourceUrl(item, t),
        metadata: withOptionalThumbnail({ views: item.views, historical: false }, item.thumbnail),
        collected_at: collectedAt,
      });
    }
    if (!t.topContent?.length && t.platforms?.length) {
      for (const p of t.platforms.slice(0, 4)) {
        rows.push({
          trend_id: t.id,
          platform: mapUiPlatformToDb(p),
          title: t.title,
          url: nonemptyString(t.sourceUrl) || null,
          metadata: { historical: false },
          collected_at: collectedAt,
        });
      }
    }
  }
  return rows;
}

async function persistTrendSources(supabase: SupabaseClient, trends: TrendItem[]): Promise<void> {
  const rows = mapTrendSourceRows(trends);
  if (!rows.length) return;
  // Avoid unbounded growth: delete prior sources for these trends then insert
  const ids = [...new Set(rows.map((r) => String(r.trend_id)))];
  await supabase.from('trend_sources').delete().in('trend_id', ids);
  const { error } = await supabase.from('trend_sources').insert(rows);
  if (error) console.error('trend_sources insert failed', error.message);
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

  const eligible = trends.filter((t) => trendAgeHours(t.firstDetectedAt) <= MAX_PERSIST_AGE_HOURS);
  if (!eligible.length) return;

  const clusterMap = await persistClusters(supabase, eligible);
  const withClusters = eligible.map((t) => ({
    ...t,
    clusterId: clusterMap.get(t.id) || t.clusterId,
  }));

  const collectedAt = new Date().toISOString();
  const records = withClusters.map(mapTrendToRecord);

  await supabase.from('trend_records').upsert(records, { onConflict: 'trend_id' });

  const snapshots = withClusters.map((t) => ({
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

  try {
    await persistTrendSources(supabase, withClusters);
  } catch (e) {
    console.error('persistTrendSources failed', e);
  }

  await purgeStaleTrendRecords(
    supabase,
    withClusters.map((t) => t.id),
    Number(process.env.TREND_STALE_MAX_AGE_HOURS || 72)
  );

  // Purge any lingering rows whose first_detected_at is older than 30 days
  const discardCutoff = new Date(Date.now() - MAX_PERSIST_AGE_HOURS * 3600 * 1000).toISOString();
  const { error: agePurgeErr } = await supabase
    .from('trend_records')
    .delete()
    .lt('first_detected_at', discardCutoff);
  if (agePurgeErr) {
    console.error('persistTrendsToSupabase 30d age purge failed', agePurgeErr.message);
  }
}
