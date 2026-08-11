import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';
import { getScrapeCreatorsApiKey } from '@/lib/trends/scrapeCreators';

function hasScrapeKey() {
  return Boolean(getScrapeCreatorsApiKey());
}

export const youtubeProvider: TrendProvider = {
  id: 'youtube',
  displayName: 'YouTube',
  async getHealth() {
    const live = Boolean(process.env.YOUTUBE_API_KEY?.trim()) || hasScrapeKey();
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
