/**
 * TrendProvider interface + metric availability triad.
 */

export type MetricAvailability = 'available' | 'unavailable' | 'estimated';

export type ProviderHealthStatus =
  'active' | 'live' | 'partial' | 'unavailable' | 'error' | 'disabled' | 'estimated' | 'demo';

export type NormalizedTrendRecord = {
  externalId: string;
  platform: string;
  title: string;
  url?: string;
  creator?: string;
  publishedAt: string;
  collectedAt: string;
  mentions?: number;
  creators?: number;
  metricAvailability: MetricAvailability;
  isReel?: boolean;
  isBreakout?: boolean;
  isRising?: boolean;
  nicheHint?: string;
  geoRegions?: string[];
  raw?: Record<string, unknown>;
};

export interface TrendProvider {
  id: string;
  displayName: string;
  fetchTrends(): Promise<NormalizedTrendRecord[]>;
  getHealth(): Promise<{
    status: ProviderHealthStatus;
    metricMode: MetricAvailability;
    notes?: string;
  }>;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseMs?: number; label?: string } = {}
): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseMs = opts.baseMs ?? 400;
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === retries) break;
      const delay = baseMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export function upsertSourceStatusPayload(opts: {
  platform: string;
  status: ProviderHealthStatus;
  metricMode: MetricAvailability;
  recordsLastRun?: number;
  error?: string | null;
  enabled?: boolean;
  pollIntervalMinutes?: number;
  notes?: string;
}) {
  const now = new Date().toISOString();
  return {
    platform: opts.platform,
    status: opts.status,
    enabled: opts.enabled ?? true,
    poll_interval_minutes: opts.pollIntervalMinutes ?? 30,
    last_success_at: opts.error ? undefined : now,
    last_error_at: opts.error ? now : undefined,
    last_error: opts.error ?? null,
    records_last_run: opts.recordsLastRun ?? 0,
    metric_mode: opts.metricMode,
    notes: opts.notes ?? null,
    updated_at: now,
  };
}
