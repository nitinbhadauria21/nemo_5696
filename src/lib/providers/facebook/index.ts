import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';
import { getScrapeCreatorsApiKey } from '@/lib/trends/scrapeCreators';

export const facebookProvider: TrendProvider = {
  id: 'facebook',
  displayName: 'Facebook',
  async getHealth() {
    const live = Boolean(getScrapeCreatorsApiKey());
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
