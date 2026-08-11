import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

/** X/Twitter — estimated only; no synthetic metrics as live. */
export const xProvider: TrendProvider = {
  id: 'twitter',
  displayName: 'X (Twitter)',
  async getHealth() {
    return {
      status: 'estimated',
      metricMode: 'estimated' as MetricAvailability,
      notes: 'Topics when available; metrics marked estimated, never live',
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
