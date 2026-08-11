import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

/** LinkedIn — unavailable metrics; never fake as live. */
export const linkedinProvider: TrendProvider = {
  id: 'linkedin',
  displayName: 'LinkedIn',
  async getHealth() {
    return {
      status: 'unavailable',
      metricMode: 'unavailable' as MetricAvailability,
      notes: 'No official metrics; never shown as live',
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
