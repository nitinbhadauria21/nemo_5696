import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';
import { withRetry } from '../types';
import { getScrapeCreatorsApiKey } from '@/lib/trends/scrapeCreators';

export const instagramProvider: TrendProvider = {
  id: 'instagram',
  displayName: 'Instagram',
  async getHealth() {
    const live = Boolean(
      getScrapeCreatorsApiKey() || process.env.INSTAGRAM_ACCESS_TOKEN?.trim()
    );
    return {
      status: live ? 'active' : 'unavailable',
      metricMode: (live ? 'available' : 'unavailable') as MetricAvailability,
      notes: undefined,
    };
  },
  async fetchTrends() {
    return withRetry(async () => [] as NormalizedTrendRecord[]);
  },
};

export function igContentWeight(isReel: boolean): number {
  return isReel ? 1.35 : 1.0;
}
