import type { TrendItem, TrendStatus, LifecycleStatus, ConfidenceLevel } from '@/lib/mockData';
import { MOCK_TRENDS } from '@/lib/mockData';
import { collectMvpTrendsDetailed } from './collectors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { persistTrendsToSupabase, mapCategoryToNiche } from './persist';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { applyTrendFilters, type TrendQueryFilters } from './filters';
import { classifyTrendNiche, normalizeUiNiche, sanitizePublicText } from './publicCopy';
import { upsertDataSourceStatusFromIngest } from './sourceStatus';
import { evaluateAlertRules } from '@/lib/alerts/evaluate';
import { buildWhyTrending } from '@/lib/signals/briefScoring';
import { loadPriorRedditMetrics } from './redditVelocity';
import type { RedditPostSnapshot } from './redditVelocity';

let memoryStore: TrendItem[] = [];
let lastCollectedAt = 0;

function nicheToUiCategory(niche: string, titleHint = ''): string {
  return normalizeUiNiche(niche, titleHint);
}

function resolveNiches(
  title: string,
  rawNiches: string[] | undefined,
  dbNiches: string[],
  dbNiche: string,
  rawCategory: string | undefined
): { category: string; niches: string[] } {
  const candidates = [...(rawNiches || []), ...dbNiches, dbNiche, rawCategory || ''].filter(
    Boolean
  );
  const mapped = candidates.map((n) => nicheToUiCategory(n, title));
  const niches = Array.from(new Set(mapped.filter(Boolean)));
  const category = niches[0] || nicheToUiCategory(dbNiche || rawCategory || 'other', title);
  return { category, niches: niches.length ? niches : [category] };
}

function scrubTrend(t: TrendItem): TrendItem {
  const category = classifyTrendNiche({
    rawNiche: t.category,
    title: t.title,
    description: t.description,
    hashtags: t.hashtags,
  });
  const niches = Array.from(
    new Set(
      (t.niches?.length ? t.niches : [t.category])
        .map((n) =>
          classifyTrendNiche({
            rawNiche: n,
            title: t.title,
            description: t.description,
            hashtags: t.hashtags,
          })
        )
        .filter(Boolean)
    )
  );
  return {
    ...t,
    description: sanitizePublicText(
      t.description,
      `${t.title} is gaining attention across ${(t.platforms || []).join(', ') || 'social'} right now.`
    ),
    category,
    niches: niches.length ? niches : [category],
  };
}

function mapDbPlatformToUi(p: string): string {
  if (p === 'google_trends') return 'google';
  return p;
}

/** Prefer DB status, fall back to score bands (aligned with collectors). */
function statusFromScores(statusRaw: string, nemo: number, cvs: number, ss: number): TrendStatus {
  const lc = statusRaw.toLowerCase();
  if (lc === 'expired' || lc === 'declining' || lc === 'fading' || lc === 'recycled')
    return 'fading';
  if (lc === 'peaking' || lc === 'breakout' || lc === 'trending') return 'hot';
  if (lc === 'rising' || lc === 'emerging') return 'rising';
  if (statusRaw === 'EXPIRED' || statusRaw === 'DECLINING') return 'fading';
  if (statusRaw === 'PEAKING') return 'hot';
  if (statusRaw === 'RISING') return 'rising';
  if (nemo >= 70 || (nemo >= 60 && cvs >= 55 && ss >= 55)) return 'hot';
  if (nemo >= 35) return 'rising';
  return 'fading';
}

function lifecycleFromRow(
  row: Record<string, unknown>,
  status: TrendStatus,
  nemo: number
): LifecycleStatus {
  const raw = String(row.lifecycle_status || row.lifecycle || '').toLowerCase();
  const allowed: LifecycleStatus[] = [
    'emerging',
    'rising',
    'breakout',
    'trending',
    'stable',
    'fading',
    'recycled',
  ];
  if (allowed.includes(raw as LifecycleStatus)) return raw as LifecycleStatus;
  if (row.breakout_boolean || Number(row.breakout_score) >= 70) return 'breakout';
  if (status === 'hot') return nemo >= 80 ? 'trending' : 'breakout';
  if (status === 'rising') return nemo < 45 ? 'emerging' : 'rising';
  return 'fading';
}

function confidenceFromScore(score: number): ConfidenceLevel {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

function rowToTrend(row: Record<string, unknown>): TrendItem {
  const raw = row.raw_platform_data as TrendItem | null;
  const geoFromRow = (row.geo_regions as string[] | null) || [];
  const nichesFromRow = (row.niches as string[] | null) || [];
  const title = String(raw?.title || row.topic_text || 'Untitled');
  const { category, niches } = resolveNiches(
    title,
    raw?.niches,
    nichesFromRow,
    String(row.niche || ''),
    raw?.category
  );
  const latestActivityAt = String(
    row.last_seen_at || row.collected_at || raw?.latestActivityAt || raw?.firstDetectedAt || ''
  );
  if (raw?.id) {
    const status =
      raw.status ||
      statusFromScores(String(row.status || 'RISING'), raw.nemoScore, raw.cvs, raw.ss);
    const conf =
      Number(row.confidence_score ?? raw.confidenceScore) ||
      Math.min(100, raw.cps + raw.freshness / 2);
    const whyFromDb = Array.isArray(row.why_trending)
      ? (row.why_trending as unknown[]).map((x) => String(x))
      : raw.whyTrending;
    return scrubTrend({
      ...raw,
      title,
      geoRegions: raw.geoRegions?.length ? raw.geoRegions : geoFromRow,
      category,
      niches,
      lifecycle: raw.lifecycle || lifecycleFromRow(row, status, raw.nemoScore),
      confidenceScore: conf,
      confidence: raw.confidence || confidenceFromScore(conf),
      acceleration: (raw.acceleration ?? Number(row.acceleration_score)) || 0,
      engagementScore: (raw.engagementScore ?? Number(row.engagement_score)) || 0,
      noveltyScore: (raw.noveltyScore ?? Number(row.novelty_score)) || 0,
      persistenceScore: (raw.persistenceScore ?? Number(row.persistence_score)) || 0,
      breakoutScore: (raw.breakoutScore ?? Number(row.breakout_score)) || 0,
      latestActivityAt: latestActivityAt || raw.latestActivityAt || raw.firstDetectedAt,
      firstDetectedAt: raw.firstDetectedAt || String(row.first_detected_at || latestActivityAt),
      clusterId: String(row.cluster_id || raw.clusterId || '') || undefined,
      whyTrending: whyFromDb?.length
        ? whyFromDb
        : buildWhyTrending({
            velocity: raw.velocity,
            spike: raw.ss,
            platforms: raw.platforms?.length,
            freshness: raw.freshness,
            breakout: raw.breakoutBoolean || (raw.breakoutScore ?? 0) >= 70,
            creators: raw.creatorsCount,
            acceleration: raw.acceleration,
            geoSpread: raw.geoSpreadScore || geoFromRow.length,
          }),
    });
  }
  const statusRaw = String(row.status || 'RISING');
  const nemo = Number(row.nemo_score) || 0;
  const cvs = Number(row.creator_velocity_score) || 0;
  const ss = Number(row.spike_score) || 0;
  const mentions24h = Number(row.mentions_last_24h) || 0;
  const creators72 = Number(row.creators_last_72h) || 0;
  const creators24 = Number(row.creators_last_24h) || creators72;
  const creators6 = Number(row.creators_last_6h) || Math.max(1, Math.round(creators24 / 4));
  const firstDetectedAt = String(
    row.first_detected_at || latestActivityAt || new Date().toISOString()
  );
  const platformsPresent = (row.platforms_present as string[] | null) || [];
  const platforms = (
    platformsPresent.length
      ? platformsPresent.map(mapDbPlatformToUi)
      : [mapDbPlatformToUi(String(row.platform || 'google'))]
  ) as TrendItem['platforms'];
  const status = statusFromScores(statusRaw, nemo, cvs, ss);
  const conf =
    Number(row.confidence_score) ||
    Math.min(100, (Number(row.cross_platform_score) || 0) + (Number(row.freshness_score) || 0) / 2);
  return scrubTrend({
    id: String(row.trend_id),
    title,
    description: '',
    category,
    niches,
    platforms,
    contentType: 'KEYWORD',
    nemoScore: nemo,
    cvs,
    ss,
    cps: Number(row.cross_platform_score) || 0,
    freshness: Number(row.freshness_score) || 0,
    freshnessMultiplier: Number(row.freshness_multiplier) || 1,
    velocity: Number(row.velocity_score) || ss,
    spike: ss,
    acceleration: Number(row.acceleration_score) || 0,
    engagementScore: Number(row.engagement_score) || 0,
    noveltyScore: Number(row.novelty_score) || 0,
    persistenceScore: Number(row.persistence_score) || 0,
    breakoutScore: Number(row.breakout_score) || 0,
    status,
    lifecycle: lifecycleFromRow(row, status, nemo),
    confidenceScore: conf,
    confidence: confidenceFromScore(conf),
    mentions24h,
    mentionsPrev24h: Number(row.mentions_prev_24h) || Math.max(1, Math.round(mentions24h * 0.6)),
    creatorsCount: creators72,
    creatorsLast6h: creators6,
    creatorsLast24h: creators24,
    creatorsLast72h: creators72,
    hashtags: [],
    firstDetectedAt,
    latestActivityAt: String(row.last_seen_at || row.collected_at || firstDetectedAt),
    sparklineData: [],
    timeAgo: '',
    isBookmarked: false,
    geoRegions: geoFromRow,
    geoSpreadScore: Number(row.geo_spread_score) || geoFromRow.length,
    breakoutBoolean: Boolean(row.breakout_boolean),
    clusterId: String(row.cluster_id || '') || undefined,
    whyTrending: Array.isArray(row.why_trending)
      ? (row.why_trending as unknown[]).map((x) => String(x))
      : buildWhyTrending({
          velocity: Number(row.velocity_score) || ss,
          spike: ss,
          platforms: platforms.length,
          freshness: Number(row.freshness_score) || 0,
          breakout: Boolean(row.breakout_boolean) || Number(row.breakout_score) >= 70,
          creators: creators72,
          acceleration: Number(row.acceleration_score) || 0,
          geoSpread: Number(row.geo_spread_score) || geoFromRow.length,
        }),
  });
}

export async function runTrendIngestion(options?: { useServiceRole?: boolean }): Promise<{
  trends: TrendItem[];
  source: 'supabase' | 'memory';
  collectedAt: string;
  error?: string | null;
}> {
  const started = Date.now();

  // Load prior Reddit post snapshots for real velocity computation
  let redditPriors: Map<string, RedditPostSnapshot> | undefined;
  try {
    const priorClient = createAdminClient() ?? (await createClient());
    if (priorClient) {
      redditPriors = await loadPriorRedditMetrics(priorClient);
      console.info(`[ingest] reddit priors loaded count=${redditPriors.size}`);
    }
  } catch (e) {
    console.error('[ingest] loadPriorRedditMetrics failed', e);
  }

  const { trends: collectedRaw, stats } = await collectMvpTrendsDetailed({ redditPriors });
  const collected = collectedRaw.map(scrubTrend);
  const collectedAt = new Date().toISOString();
  const now = Date.now();
  let persistError: string | null = null;

  const persistAndStatus = async (client: NonNullable<ReturnType<typeof createAdminClient>>) => {
    await persistTrendsToSupabase(client, collected);
    try {
      await upsertDataSourceStatusFromIngest(client, collected, stats);
    } catch (e) {
      console.error('data_source_status upsert failed', e);
    }
    try {
      const alertResult = await evaluateAlertRules(client, collected);
      console.info(`[ingest] alerts created=${alertResult.created}`);
    } catch (e) {
      console.error('alert evaluation failed', e);
    }
  };

  if (collected.length) {
    memoryStore = collected;
    lastCollectedAt = now;

    if (options?.useServiceRole) {
      const admin = createAdminClient();
      if (admin) {
        try {
          await persistAndStatus(admin);
          await logCollectorRun(admin, {
            source: 'supabase',
            count: collected.length,
            startedAt: new Date(started).toISOString(),
            finishedAt: collectedAt,
            error: null,
          });
          return { trends: collected, source: 'supabase', collectedAt };
        } catch (e) {
          persistError = e instanceof Error ? e.message : 'persist failed';
        }
      }
    }

    const supabase = await createClient();
    if (supabase) {
      try {
        await persistAndStatus(supabase);
        return { trends: collected, source: 'supabase', collectedAt };
      } catch (e) {
        persistError = e instanceof Error ? e.message : 'persist failed';
      }
    }
  } else if (options?.useServiceRole) {
    // Still record honest 0-count status when every collector returned empty
    const admin = createAdminClient();
    if (admin) {
      try {
        await upsertDataSourceStatusFromIngest(admin, [], stats);
      } catch (e) {
        console.error('data_source_status upsert failed', e);
      }
    }
  }

  const admin = createAdminClient();
  if (admin && options?.useServiceRole) {
    await logCollectorRun(admin, {
      source: 'memory',
      count: collected.length,
      startedAt: new Date(started).toISOString(),
      finishedAt: collectedAt,
      error: persistError,
    });
  }

  return {
    trends: collected.length ? collected : memoryStore,
    source: 'memory',
    collectedAt,
    error: persistError,
  };
}

async function logCollectorRun(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  opts: {
    source: string;
    count: number;
    startedAt: string;
    finishedAt: string;
    error: string | null;
  }
) {
  try {
    await admin.from('collector_runs').insert({
      source: opts.source,
      trend_count: opts.count,
      started_at: opts.startedAt,
      finished_at: opts.finishedAt,
      error: opts.error,
    });
  } catch {
    // table may not exist yet before migration 007
  }
}

export async function getTrends(options?: {
  refresh?: boolean;
  filters?: TrendQueryFilters;
  /** Fetch more rows before filtering (default 200). */
  fetchLimit?: number;
}): Promise<{
  trends: TrendItem[];
  source: 'supabase' | 'memory' | 'mock';
  collectedAt: string | null;
  lastIngestAt?: string | null;
  totalBeforeFilter?: number;
}> {
  // refresh is ignored — public reads must never trigger collectors (DoS / API quota).
  void options?.refresh;
  const now = Date.now();
  const supabaseConfigured = isSupabaseConfigured();
  const nicheFilters = (options?.filters?.niche ?? []).filter((n) => n && n !== 'All');
  const fetchLimit = options?.fetchLimit ?? (nicheFilters.length > 0 ? 500 : 200);
  let lastIngestAt: string | null = null;

  const finalize = (
    trends: TrendItem[],
    source: 'supabase' | 'memory' | 'mock',
    collectedAt: string | null
  ) => {
    const scrubbed = trends.map(scrubTrend);
    const totalBeforeFilter = scrubbed.length;
    const filtered = options?.filters
      ? applyTrendFilters(scrubbed, options.filters)
      : applyTrendFilters(scrubbed, { timeframeHours: 24, neverBlankTopK: true });
    return {
      trends: filtered,
      source,
      collectedAt,
      lastIngestAt,
      totalBeforeFilter,
    };
  };

  try {
    // Prefer service role for public trend reads so RLS never blanks the dashboard.
    const admin = createAdminClient();
    const userClient = await createClient();
    const reader = admin || userClient;

    if (reader) {
      try {
        const { data: runs } = await reader
          .from('collector_runs')
          .select('finished_at')
          .order('finished_at', { ascending: false })
          .limit(1);
        lastIngestAt = runs?.[0]?.finished_at ? String(runs[0].finished_at) : null;
      } catch {
        // optional
      }

      // When browsing by niche, filter at the DB so niche rows are not drowned out
      // by the global top-N score list (mostly "other"). Fetch per-platform so
      // high-scoring Instagram rows cannot crowd out YouTube/TikTok/etc.
      let data: Record<string, unknown>[] | null = null;
      let error: { message: string } | null = null;

      if (nicheFilters.length > 0) {
        const dbEnums = Array.from(
          new Set(nicheFilters.map((n) => mapCategoryToNiche(n)).filter(Boolean))
        );
        const uiLabels = Array.from(
          new Set(nicheFilters.map((n) => normalizeUiNiche(n)).filter((n) => n && n !== 'other'))
        );
        const orParts: string[] = [];
        if (dbEnums.length) {
          orParts.push(`niche.in.(${dbEnums.join(',')})`);
        }
        if (uiLabels.length) {
          // PostgREST overlaps: niches.ov.{Fitness,AI}
          orParts.push(`niches.ov.{${uiLabels.join(',')}}`);
        }
        const nicheOr = orParts.length ? orParts.join(',') : null;

        const dbPlatforms = [
          'instagram',
          'youtube',
          'youtube_shorts',
          'google_trends',
          'reddit',
          'tiktok',
          'linkedin',
          'twitter',
          'facebook',
        ] as const;
        const perPlatformLimit = Math.max(20, Math.ceil(fetchLimit / dbPlatforms.length));

        const settled = await Promise.all(
          dbPlatforms.map(async (platform) => {
            let q = reader
              .from('trend_records')
              .select('*')
              .eq('platform', platform)
              .order('nemo_score', { ascending: false })
              .limit(perPlatformLimit);
            if (nicheOr) q = q.or(nicheOr);
            return q;
          })
        );

        const merged = new Map<string, Record<string, unknown>>();
        const errors: string[] = [];
        for (const res of settled) {
          if (res.error) {
            errors.push(res.error.message);
            continue;
          }
          for (const row of res.data || []) {
            const r = row as Record<string, unknown>;
            const id = String(r.trend_id || r.id || '');
            if (id) merged.set(id, r);
          }
        }
        if (merged.size > 0) {
          data = [...merged.values()].sort(
            (a, b) => Number(b.nemo_score || 0) - Number(a.nemo_score || 0)
          );
        } else if (errors.length) {
          error = { message: errors[0] };
        }
      } else {
        const res = await reader
          .from('trend_records')
          .select('*')
          .order('nemo_score', { ascending: false })
          .limit(fetchLimit);
        data = (res.data as Record<string, unknown>[] | null) || null;
        error = res.error;
      }

      if (error) {
        console.error('getTrends trend_records select failed', error.message);
      }

      if (!error && data?.length) {
        return finalize(
          data.map((row) => rowToTrend(row)),
          'supabase',
          lastIngestAt || new Date(lastCollectedAt || now).toISOString()
        );
      }

      if (supabaseConfigured && !error) {
        if (memoryStore.length) {
          return finalize(memoryStore, 'memory', new Date(lastCollectedAt || now).toISOString());
        }
        return finalize([], 'supabase', new Date().toISOString());
      }
    }
  } catch {
    // fall through
  }

  if (memoryStore.length) {
    return finalize(memoryStore, 'memory', new Date(lastCollectedAt).toISOString());
  }

  if (supabaseConfigured || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    return finalize([], 'supabase', null);
  }

  return finalize(MOCK_TRENDS, 'mock', null);
}

export async function getRelatedTrends(
  trendId: string,
  niche?: string,
  limit = 6
): Promise<TrendItem[]> {
  const result = await getTrends({ refresh: false });
  return result.trends
    .filter((t) => t.id !== trendId)
    .filter((t) => !niche || t.category === niche)
    .slice(0, limit);
}
