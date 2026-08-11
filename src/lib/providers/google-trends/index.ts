import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const googleTrendsProvider: TrendProvider = {
  id: 'google_trends',
  displayName: 'Google Trends',
  async getHealth() {
    const live = Boolean(
      process.env.SERPAPI_KEY?.trim() ||
        process.env.SEARCHAPI_KEY?.trim() ||
        process.env.SEARCHAPI_API_KEY?.trim() ||
        process.env.GOOGLE_TRENDS_PROXY_URL?.trim()
    );
    return {
      status: live ? 'active' : 'unavailable',
      metricMode: (live ? 'available' : 'unavailable') as MetricAvailability,
      notes: undefined,
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};

export function classifyGtSurface(
  growthPct: number,
  breakout: boolean
): 'breakout' | 'rising' | 'trending_now' {
  if (breakout || growthPct >= 5000) return 'breakout';
  if (growthPct >= 100) return 'rising';
  return 'trending_now';
}
