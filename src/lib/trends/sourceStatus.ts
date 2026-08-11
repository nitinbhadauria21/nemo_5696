import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrendItem, TrendPlatform } from '@/lib/mockData';
import { ALL_PROVIDERS } from '@/lib/providers';
import {
  upsertSourceStatusPayload,
  type ProviderHealthStatus,
  type MetricAvailability,
} from '@/lib/providers/types';

/** Map UI platform tags onto data_source_status.platform keys. */
function platformToStatusKey(p: TrendPlatform | string): string {
  if (p === 'google') return 'google_trends';
  if (p === 'youtube_shorts') return 'youtube';
  return String(p);
}

export type ProviderRunStat = {
  platform: string;
  count: number;
  error?: string | null;
  startedAt: string;
  finishedAt: string;
};

/**
 * Upsert data_source_status from real collector results + provider health.
 * 0 records → never "Live"/active (Unavailable or Partial/Limited for limited APIs).
 */
export async function upsertDataSourceStatusFromIngest(
  supabase: SupabaseClient,
  trends: TrendItem[],
  stats: ProviderRunStat[]
): Promise<void> {
  const counts = new Map<string, number>();
  for (const t of trends) {
    for (const p of t.platforms || []) {
      const key = platformToStatusKey(p);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const healthList = await Promise.all(
    ALL_PROVIDERS.map(async (p) => {
      const h = await p.getHealth();
      return { id: p.id, ...h };
    })
  );
  const healthById = new Map(healthList.map((h) => [h.id, h]));
  const statById = new Map(stats.map((s) => [s.platform, s]));

  const rows = ALL_PROVIDERS.map((p) => {
    const health = healthById.get(p.id);
    const stat = statById.get(p.id);
    const records = Math.max(counts.get(p.id) || 0, stat?.count || 0);
    const keyOk = health?.status === 'active' || health?.status === 'live' || health?.status === 'partial';
    const metricMode = (health?.metricMode || 'unavailable') as MetricAvailability;
    let status: ProviderHealthStatus;

    if (p.id === 'linkedin') {
      status = 'unavailable';
    } else if (p.id === 'twitter') {
      // X is never full Live without official firehose
      status = records > 0 ? 'partial' : keyOk ? 'estimated' : 'unavailable';
    } else if (!keyOk && records === 0) {
      status = 'unavailable';
    } else if (records === 0) {
      // Keys present but this run returned nothing — do not claim Live
      status = p.id === 'reddit' || p.id === 'google_trends' || p.id === 'youtube' ? 'unavailable' : 'partial';
    } else if (health?.status === 'partial' || health?.status === 'estimated') {
      status = health.status === 'estimated' ? 'estimated' : 'partial';
    } else {
      status = 'active';
    }

    const error =
      stat?.error ||
      (records === 0 && keyOk ? 'No records this run' : null);

    return upsertSourceStatusPayload({
      platform: p.id,
      status,
      metricMode,
      recordsLastRun: records,
      error: status === 'active' || status === 'partial' || status === 'estimated' ? null : error,
      notes: undefined,
    });
  });

  const { error } = await supabase.from('data_source_status').upsert(rows, {
    onConflict: 'platform',
  });
  if (error) {
    console.error('upsertDataSourceStatusFromIngest failed', error.message);
  }
}
