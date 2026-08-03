import type { TrendItem } from '@/lib/mockData';
import { MOCK_TRENDS } from '@/lib/mockData';
import { collectMvpTrends } from './collectors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { persistTrendsToSupabase } from './persist';
import { isSupabaseConfigured } from '@/lib/supabase/config';

let memoryStore: TrendItem[] = [];
let lastCollectedAt = 0;

function rowToTrend(row: Record<string, unknown>): TrendItem {
  const raw = row.raw_platform_data as TrendItem | null;
  if (raw?.id) return raw;
  const statusRaw = String(row.status || 'RISING');
  const mentions24h = Number(row.mentions_last_24h) || 0;
  const creators72 = Number(row.creators_last_72h) || 0;
  const creators24 = Number(row.creators_last_24h) || creators72;
  const creators6 = Number(row.creators_last_6h) || Math.max(1, Math.round(creators24 / 4));
  const firstDetectedAt = String(row.first_detected_at || new Date().toISOString());
  return {
    id: String(row.trend_id),
    title: String(row.topic_text || 'Untitled'),
    description: '',
    category: String(row.niche || 'other'),
    platforms: ['google'],
    contentType: 'KEYWORD',
    nemoScore: Number(row.nemo_score) || 0,
    cvs: Number(row.creator_velocity_score) || 0,
    ss: Number(row.spike_score) || 0,
    cps: Number(row.cross_platform_score) || 0,
    freshness: Number(row.freshness_score) || 0,
    freshnessMultiplier: Number(row.freshness_multiplier) || 1,
    velocity: Number(row.spike_score) || 0,
    spike: Number(row.spike_score) || 0,
    status: statusRaw === 'PEAKING' ? 'hot' : statusRaw === 'RISING' ? 'rising' : 'fading',
    mentions24h,
    mentionsPrev24h: Number(row.mentions_prev_24h) || Math.max(1, Math.round(mentions24h * 0.6)),
    creatorsCount: creators72,
    creatorsLast6h: creators6,
    creatorsLast24h: creators24,
    creatorsLast72h: creators72,
    hashtags: [],
    firstDetectedAt,
    sparklineData: [],
    timeAgo: '',
    isBookmarked: false,
    geoRegions: (row.geo_regions as string[]) || [],
  };
}

export async function runTrendIngestion(options?: { useServiceRole?: boolean }): Promise<{
  trends: TrendItem[];
  source: 'supabase' | 'memory';
  collectedAt: string;
  error?: string | null;
}> {
  const started = Date.now();
  const collected = await collectMvpTrends();
  const collectedAt = new Date().toISOString();
  const now = Date.now();
  let persistError: string | null = null;

  if (collected.length) {
    memoryStore = collected;
    lastCollectedAt = now;

    if (options?.useServiceRole) {
      const admin = createAdminClient();
      if (admin) {
        try {
          await persistTrendsToSupabase(admin, collected);
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
        await persistTrendsToSupabase(supabase, collected);
        return { trends: collected, source: 'supabase', collectedAt };
      } catch (e) {
        persistError = e instanceof Error ? e.message : 'persist failed';
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

export async function getTrends(options?: { refresh?: boolean }): Promise<{
  trends: TrendItem[];
  source: 'supabase' | 'memory' | 'mock';
  collectedAt: string | null;
}> {
  const refresh = options?.refresh ?? false;
  const now = Date.now();
  const supabaseConfigured = isSupabaseConfigured();

  try {
    const supabase = await createClient();
    if (supabase) {
      if (refresh || now - lastCollectedAt > 5 * 60 * 1000) {
        await runTrendIngestion();
      }

      const { data, error } = await supabase
        .from('trend_records')
        .select('*')
        .order('nemo_score', { ascending: false })
        .limit(40);

      if (!error && data?.length) {
        return {
          trends: data.map((row) => rowToTrend(row as Record<string, unknown>)),
          source: 'supabase',
          collectedAt: new Date(lastCollectedAt || now).toISOString(),
        };
      }

      if (supabaseConfigured && !error) {
        // Honest empty: do not serve MOCK_TRENDS when DB is live but empty
        if (memoryStore.length) {
          return {
            trends: memoryStore,
            source: 'memory',
            collectedAt: new Date(lastCollectedAt || now).toISOString(),
          };
        }
        return { trends: [], source: 'supabase', collectedAt: new Date().toISOString() };
      }
    }
  } catch {
    // fall through
  }

  if (refresh || !memoryStore.length || now - lastCollectedAt > 5 * 60 * 1000) {
    const result = await runTrendIngestion();
    if (result.trends.length) {
      memoryStore = result.trends;
      lastCollectedAt = now;
    }
  }

  if (memoryStore.length) {
    return {
      trends: memoryStore,
      source: 'memory',
      collectedAt: new Date(lastCollectedAt).toISOString(),
    };
  }

  if (supabaseConfigured) {
    return { trends: [], source: 'supabase', collectedAt: null };
  }

  return { trends: MOCK_TRENDS, source: 'mock', collectedAt: null };
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
