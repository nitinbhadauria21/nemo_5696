import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const facebookProvider: TrendProvider = {
  id: 'facebook',
  displayName: 'Facebook',
  async getHealth() {
    return {
      status: 'partial',
      metricMode: 'estimated' as MetricAvailability,
      notes: 'Extra platform; labeled in Sources',
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
