import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const linkedinProvider: TrendProvider = {
  id: 'linkedin',
  displayName: 'LinkedIn',
  async getHealth() {
    return {
      status: 'unavailable',
      metricMode: 'unavailable' as MetricAvailability,
      notes: undefined,
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
