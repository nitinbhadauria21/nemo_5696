import type { TrendItem } from '@/lib/mockData';
import { MOCK_TRENDS } from '@/lib/mockData';
import { collectMvpTrends } from './collectors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { persistTrendsToSupabase } from './persist';

let memoryStore: TrendItem[] = [];
let lastCollectedAt = 0;

export async function runTrendIngestion(options?: { useServiceRole?: boolean }): Promise<{
  trends: TrendItem[];
  source: 'supabase' | 'memory';
  collectedAt: string;
}> {
  const collected = await collectMvpTrends();
  const collectedAt = new Date().toISOString();
  const now = Date.now();

  if (collected.length) {
    memoryStore = collected;
    lastCollectedAt = now;

    if (options?.useServiceRole) {
      const admin = createAdminClient();
      if (admin) {
        try {
          await persistTrendsToSupabase(admin, collected);
          return { trends: collected, source: 'supabase', collectedAt };
        } catch {
          // fall through to anon client attempt
        }
      }
    }

    const supabase = await createClient();
    if (supabase) {
      try {
        await persistTrendsToSupabase(supabase, collected);
        return { trends: collected, source: 'supabase', collectedAt };
      } catch {
        // schema may not be applied yet
      }
    }
  }

  return {
    trends: collected.length ? collected : memoryStore,
    source: 'memory',
    collectedAt,
  };
}

export async function getTrends(options?: { refresh?: boolean }): Promise<{
  trends: TrendItem[];
  source: 'supabase' | 'memory' | 'mock';
  collectedAt: string | null;
}> {
  const refresh = options?.refresh ?? false;
  const now = Date.now();

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
        const trends = data.map((row: Record<string, unknown>) => {
          const raw = row.raw_platform_data as TrendItem | null;
          if (raw?.id) return raw;
          return {
            ...MOCK_TRENDS[0],
            id: row.trend_id as string,
            title: row.topic_text as string,
            nemoScore: row.nemo_score as number,
            cvs: row.creator_velocity_score as number,
            ss: row.spike_score as number,
            cps: row.cross_platform_score as number,
            freshness: row.freshness_score as number,
            freshnessMultiplier: row.freshness_multiplier as number,
            status:
              row.status === 'PEAKING' ? 'hot' : row.status === 'RISING' ? 'rising' : 'fading',
            mentions24h: (row.mentions_last_24h as number) ?? 0,
            creatorsCount: (row.creators_last_72h as number) ?? 0,
          } as TrendItem;
        });
        return {
          trends,
          source: 'supabase',
          collectedAt: new Date(lastCollectedAt || now).toISOString(),
        };
      }
    }
  } catch {
    // fall through to memory/mock
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
