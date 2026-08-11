import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const tiktokProvider: TrendProvider = {
  id: 'tiktok',
  displayName: 'TikTok',
  async getHealth() {
    const hasKey = Boolean(process.env.APIFY_TOKEN || process.env.TIKTOK_API_KEY);
    return {
      status: hasKey ? 'partial' : 'partial',
      metricMode: 'estimated' as MetricAvailability,
      notes: 'Honest gaps without official TikTok metrics API',
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
