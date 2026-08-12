import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';
import { isRedditOAuthConfigured } from '@/lib/trends/redditClient';

export const redditProvider: TrendProvider = {
  id: 'reddit',
  displayName: 'Reddit',
  async getHealth() {
    if (isRedditOAuthConfigured()) {
      return {
        status: 'active',
        metricMode: 'available' as MetricAvailability,
        notes: undefined,
      };
    }
    return {
      status: 'unavailable',
      metricMode: 'unavailable' as MetricAvailability,
      notes:
        'Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (free Reddit app-only OAuth) for live Reddit trends. See docs/GET_PLATFORM_API_KEYS.txt.',
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
