import type { TrendItem } from '@/lib/mockData';

/** Dashboard display bar: Nemo Score ≥60, CVS ≥55, Spike Score ≥55. */
export const TRENDING_GATE = {
  nemoScore: 60,
  cvs: 55,
  ss: 55,
} as const;

/**
 * Whether a scored topic qualifies as a trending topic for the main Dashboard grid.
 * All ingest rows may be saved; only gate-passers are shown.
 */
export function isTrendingTopic(trend: Pick<TrendItem, 'nemoScore' | 'cvs' | 'ss'>): boolean {
  return (
    trend.nemoScore >= TRENDING_GATE.nemoScore &&
    trend.cvs >= TRENDING_GATE.cvs &&
    trend.ss >= TRENDING_GATE.ss
  );
}
