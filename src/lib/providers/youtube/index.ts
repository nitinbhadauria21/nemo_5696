import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';

export const youtubeProvider: TrendProvider = {
  id: 'youtube',
  displayName: 'YouTube',
  async getHealth() {
    const hasKey = Boolean(process.env.YOUTUBE_API_KEY);
    return {
      status: hasKey ? 'partial' : 'partial',
      metricMode: (hasKey ? 'available' : 'estimated') as MetricAvailability,
      notes: 'Shorts + long-form; snapshots when API available',
    };
  },
  async fetchTrends(): Promise<NormalizedTrendRecord[]> {
    return [];
  },
};
