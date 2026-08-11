import type { TrendProvider, NormalizedTrendRecord, MetricAvailability } from '../types';
import { withRetry } from '../types';

/** Instagram adapter — reels weighted higher when type known. */
export const instagramProvider: TrendProvider = {
  id: 'instagram',
  displayName: 'Instagram',
  async getHealth() {
    const hasKey = Boolean(process.env.APIFY_TOKEN || process.env.PHYLLO_API_KEY);
    return {
      status: hasKey ? 'partial' : 'estimated',
      metricMode: (hasKey ? 'estimated' : 'estimated') as MetricAvailability,
      notes: 'Reels weighted > posts when content type known',
    };
  },
  async fetchTrends() {
    return withRetry(async () => {
      // Collectors already pull IG via social connect / apify when configured.
      // Adapter returns empty here; pipeline uses collectors. Marks honesty.
      return [] as NormalizedTrendRecord[];
    });
  },
};

export function igContentWeight(isReel: boolean): number {
  return isReel ? 1.35 : 1.0;
}
