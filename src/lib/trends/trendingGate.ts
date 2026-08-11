import type { TrendItem, TrendPlatform } from '@/lib/mockData';

/** Soft quality bar — used only as a ranking boost, never as a hard filter. */
export const TRENDING_GATE = {
  nemoScore: 60,
  cvs: 55,
  ss: 55,
} as const;

/** Soft ranking boost for topics that clear the old Score/CVS/SS bar. */
const SOFT_GATE_BOOST = 12;

const DASHBOARD_PLATFORMS: TrendPlatform[] = [
  'youtube',
  'youtube_shorts',
  'instagram',
  'google',
  'reddit',
  'tiktok',
  'linkedin',
  'twitter',
  'facebook',
];

export type SelectDashboardTrendsOptions = {
  /** Top K items kept per platform (default 3). */
  perPlatformK?: number;
  /** Max cards after union + sort (default 40). */
  cap?: number;
};

/**
 * Soft helper: whether a topic would have cleared the old hard trending bar.
 * Prefer {@link selectDashboardTrends} for Dashboard display selection.
 */
export function isTrendingTopic(trend: Pick<TrendItem, 'nemoScore' | 'cvs' | 'ss'>): boolean {
  return (
    trend.nemoScore >= TRENDING_GATE.nemoScore &&
    trend.cvs >= TRENDING_GATE.cvs &&
    trend.ss >= TRENDING_GATE.ss
  );
}

function rankScore(trend: TrendItem): number {
  return trend.nemoScore + (isTrendingTopic(trend) ? SOFT_GATE_BOOST : 0);
}

/** Rank by Nemo Score (soft-boosted), then Spike, then CVS, then freshness. */
function compareTrends(a: TrendItem, b: TrendItem): number {
  const byRank = rankScore(b) - rankScore(a);
  if (byRank !== 0) return byRank;
  const bySs = b.ss - a.ss;
  if (bySs !== 0) return bySs;
  const byCvs = b.cvs - a.cvs;
  if (byCvs !== 0) return byCvs;
  return b.freshness - a.freshness;
}

/**
 * Never-blank Dashboard candidate set: top-K per platform, unioned, sorted, capped.
 * Soft-boosts old gate-passers; never returns empty when `trends` has rows.
 */
export function selectDashboardTrends(
  trends: TrendItem[],
  opts: SelectDashboardTrendsOptions = {}
): TrendItem[] {
  if (trends.length === 0) return [];

  const perPlatformK = opts.perPlatformK ?? 3;
  const cap = opts.cap ?? 40;

  const byId = new Map<string, TrendItem>();

  for (const platform of DASHBOARD_PLATFORMS) {
    const forPlatform = trends
      .filter((t) => t.platforms.includes(platform))
      .sort(compareTrends)
      .slice(0, perPlatformK);
    for (const item of forPlatform) {
      byId.set(item.id, item);
    }
  }

  // Guarantee non-empty when input has rows (e.g. unknown platforms only).
  if (byId.size === 0) {
    const topOverall = [...trends].sort(compareTrends).slice(0, Math.min(cap, trends.length));
    for (const item of topOverall) {
      byId.set(item.id, item);
    }
  }

  const selected = [...byId.values()].sort(compareTrends);

  // If under cap after per-platform union, fill with next-best overall (never blank).
  if (selected.length < Math.min(cap, trends.length)) {
    const selectedIds = new Set(selected.map((t) => t.id));
    const fillers = [...trends]
      .filter((t) => !selectedIds.has(t.id))
      .sort(compareTrends)
      .slice(0, cap - selected.length);
    selected.push(...fillers);
    selected.sort(compareTrends);
  }

  return selected.slice(0, cap);
}
