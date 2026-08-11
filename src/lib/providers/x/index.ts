import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';
import { getScrapeCreatorsApiKey } from '@/lib/trends/scrapeCreators';

export const xProvider: TrendProvider = {
  id: 'twitter',
  displayName: 'X',
  async getHealth() {
    const live = Boolean(getScrapeCreatorsApiKey() || process.env.TWITTER_BEARER_TOKEN?.trim());
    return {
      status: live ? 'partial' : 'unavailable',
      metricMode: (live ? 'estimated' : 'unavailable') as MetricAvailability,
      notes: undefined,
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
