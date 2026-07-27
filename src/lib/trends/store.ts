import type { TrendItem } from '@/lib/mockData';
import { MOCK_TRENDS } from '@/lib/mockData';
import { collectMvpTrends } from './collectors';
import { createClient } from '@/lib/supabase/server';

let memoryStore: TrendItem[] = [];
let lastCollectedAt = 0;

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
        const collected = await collectMvpTrends();
        if (collected.length) {
          memoryStore = collected;
          lastCollectedAt = now;
          // Best-effort upsert into trend_records when table exists
          try {
            await supabase.from('trend_records').upsert(
              collected.map((t) => ({
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
                status: t.status === 'hot' ? 'PEAKING' : t.status === 'rising' ? 'RISING' : 'DECLINING',
                platforms_present: t.platforms.map((p) => (p === 'google' ? 'google_trends' : p)),
                mentions_last_24h: t.mentions24h,
                mentions_prev_24h: t.mentionsPrev24h,
                creators_last_6h: t.creatorsLast6h,
                creators_last_24h: t.creatorsLast24h,
                creators_last_72h: t.creatorsLast72h,
                raw_platform_data: t,
              })),
              { onConflict: 'trend_id' }
            );
          } catch {
            // schema may not be applied yet
          }
        }
      }

      const { data, error } = await supabase
        .from('trend_records')
        .select('*')
        .order('nemo_score', { ascending: false })
        .limit(40);

      if (!error && data?.length) {
        const trends = data.map((row: any) => {
          const raw = row.raw_platform_data as TrendItem | null;
          if (raw?.id) return raw;
          return {
            ...MOCK_TRENDS[0],
            id: row.trend_id,
            title: row.topic_text,
            nemoScore: row.nemo_score,
            cvs: row.creator_velocity_score,
            ss: row.spike_score,
            cps: row.cross_platform_score,
            freshness: row.freshness_score,
            freshnessMultiplier: row.freshness_multiplier,
            status: row.status === 'PEAKING' ? 'hot' : row.status === 'RISING' ? 'rising' : 'fading',
            mentions24h: row.mentions_last_24h ?? 0,
            creatorsCount: row.creators_last_72h ?? 0,
          } as TrendItem;
        });
        return { trends, source: 'supabase', collectedAt: new Date(lastCollectedAt || now).toISOString() };
      }
    }
  } catch {
    // fall through to memory/mock
  }

  if (refresh || !memoryStore.length || now - lastCollectedAt > 5 * 60 * 1000) {
    const collected = await collectMvpTrends();
    if (collected.length) {
      memoryStore = collected;
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
