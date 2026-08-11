import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';
import { getScrapeCreatorsApiKey } from '@/lib/trends/scrapeCreators';

export const tiktokProvider: TrendProvider = {
  id: 'tiktok',
  displayName: 'TikTok',
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
