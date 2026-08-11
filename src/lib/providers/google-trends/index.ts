import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const googleTrendsProvider: TrendProvider = {
  id: 'google_trends',
  displayName: 'Google Trends',
  async getHealth() {
    return {
      status: 'active',
      metricMode: 'available' as MetricAvailability,
      notes: 'Distinguishes Trending Now vs rising/breakout when API allows',
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
