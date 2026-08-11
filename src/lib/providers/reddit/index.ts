import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const redditProvider: TrendProvider = {
  id: 'reddit',
  displayName: 'Reddit',
  async getHealth() {
    return {
      status: 'active',
      metricMode: 'available' as MetricAvailability,
      notes: 'Live collector',
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
