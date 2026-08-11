import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const redditProvider: TrendProvider = {
  id: 'reddit',
  displayName: 'Reddit',
  async getHealth() {
    // Public JSON endpoints — capability is always available; live status comes from last ingest counts.
    return {
      status: 'active',
      metricMode: 'available' as MetricAvailability,
      notes: undefined,
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
