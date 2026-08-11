/**
 * Brief-aligned scoring weights, lifecycle, velocity windows, novelty, clustering.
 */

export type BriefWeights = {
  freshness: number;
  velocity: number;
  acceleration: number;
  cross_platform: number;
  engagement: number;
  novelty: number;
  creator: number;
  persistence: number;
  breakout_modifier: number;
  geo_spread_modifier: number;
};

export const DEFAULT_BRIEF_WEIGHTS: BriefWeights = {
  freshness: 0.2,
  velocity: 0.18,
  acceleration: 0.12,
  cross_platform: 0.15,
  engagement: 0.12,
  novelty: 0.08,
  creator: 0.1,
  persistence: 0.05,
  breakout_modifier: 1.25,
  geo_spread_modifier: 1.1,
};

/** Hard reject from active feed after 30 days. */
export const HARD_REJECT_HOURS = 30 * 24;
/** Soft penalty starts after 7 days. */
export const SEVEN_DAY_PENALTY_HOURS = 7 * 24;

export type LifecycleStatus =
  'emerging' | 'rising' | 'breakout' | 'trending' | 'stable' | 'fading' | 'recycled';

export function computeMultiWindowSpike(windows: {
  mentions_1h: number;
  mentions_6h: number;
  mentions_24h: number;
  prior_1h: number;
  prior_6h: number;
  prior_24h: number;
}): number {
  const ratios = [
    windows.mentions_1h / Math.max(windows.prior_1h, 5),
    windows.mentions_6h / Math.max(windows.prior_6h, 10),
    windows.mentions_24h / Math.max(windows.prior_24h, 10),
  ];
  const raw = Math.max(...ratios);
  const capped = Math.min(raw, 50); // cap extreme spikes
  return Math.min(100, Math.log10(Math.max(capped * 10, 1)) * 40);
}

export function computeCreatorVelocityWindows(counts: {
  creators_1h: number;
  creators_6h: number;
  creators_24h: number;
  creators_48h: number;
  creators_72h: number;
}): number {
  const raw =
    (counts.creators_1h * 8 +
      counts.creators_6h * 4 +
      counts.creators_24h * 2 +
      counts.creators_48h) /
    (counts.creators_72h + 1);
  return Math.min(100, raw * 20);
}

export function computeAcceleration(currentVelocity: number, priorVelocity: number): number {
  return Math.round((currentVelocity - priorVelocity) * 100) / 100;
}

export function computeNoveltyScore(opts: {
  title: string;
  seenTitles?: string[];
  ageHours: number;
}): number {
  const norm = normalizeClusterKey(opts.title);
  const seen = (opts.seenTitles || []).map(normalizeClusterKey);
  if (seen.includes(norm)) return 10;
  // Newer unique topics score higher
  const agePenalty = Math.min(40, opts.ageHours / 2);
  return Math.max(15, 100 - agePenalty);
}

const EVERGREEN_NAMES = new Set(
  [
    'ai',
    'fitness',
    'finance',
    'fashion',
    'gaming',
    'movies',
    'education',
    'startups',
    'travel',
    'food',
    'technology',
    'news',
    'sports',
  ].map((s) => s.toLowerCase())
);

export function isEvergreenTopic(title: string): boolean {
  const key = normalizeClusterKey(title);
  return EVERGREEN_NAMES.has(key) || key.length < 3;
}

export function normalizeClusterKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^\w]+/g, '')
    .trim();
}

export function classifyLifecycle(opts: {
  nemoScore: number;
  velocity: number;
  acceleration: number;
  ageHours: number;
  breakout: boolean;
  platforms: number;
  isExpired30d?: boolean;
}): LifecycleStatus {
  if (opts.isExpired30d || opts.ageHours > HARD_REJECT_HOURS) return 'recycled';
  if (opts.breakout && opts.acceleration > 5 && opts.ageHours < 48) return 'breakout';
  if (opts.nemoScore >= 75 && opts.platforms >= 2) return 'trending';
  if (opts.ageHours < 12 && opts.velocity > 1 && opts.nemoScore >= 35) return 'emerging';
  if (opts.acceleration > 0 && opts.nemoScore >= 45) return 'rising';
  if (opts.acceleration < -2 || (opts.ageHours > 72 && opts.nemoScore < 40)) return 'fading';
  if (opts.nemoScore >= 40) return 'stable';
  if (opts.nemoScore >= 25) return 'rising';
  return 'fading';
}

export function applyBriefScore(opts: {
  weights?: Partial<BriefWeights>;
  freshness: number;
  velocity: number;
  acceleration: number;
  crossPlatform: number;
  engagement: number;
  novelty: number;
  creator: number;
  persistence: number;
  breakout: boolean;
  geoSpread: number;
  ageHours: number;
  platformCount?: number;
}): { score: number; confidence: number; rejected30d: boolean; sevenDayPenalty: boolean } {
  const w = { ...DEFAULT_BRIEF_WEIGHTS, ...opts.weights };
  if (opts.ageHours > HARD_REJECT_HOURS) {
    return { score: 0, confidence: 0, rejected30d: true, sevenDayPenalty: true };
  }

  const accelNorm = Math.min(100, Math.max(0, 50 + opts.acceleration * 5));
  const persistNorm = Math.min(100, opts.persistence);
  const engNorm = Math.min(100, opts.engagement);

  let weighted =
    opts.freshness * w.freshness +
    opts.velocity * w.velocity +
    accelNorm * w.acceleration +
    opts.crossPlatform * w.cross_platform +
    engNorm * w.engagement +
    opts.novelty * w.novelty +
    opts.creator * w.creator +
    persistNorm * w.persistence;

  if (opts.breakout) weighted *= w.breakout_modifier;
  if (opts.geoSpread >= 3) weighted *= w.geo_spread_modifier;

  const sevenDayPenalty = opts.ageHours > SEVEN_DAY_PENALTY_HOURS;
  if (sevenDayPenalty) weighted *= 0.65;

  const score = Math.min(100, Math.max(0, weighted));
  const confidence = Math.min(
    100,
    opts.crossPlatform * 0.4 + opts.freshness * 0.3 + Math.min(40, (opts.platformCount ?? 1) * 12)
  );

  return {
    score: Math.round(score * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    rejected30d: false,
    sevenDayPenalty,
  };
}

export function buildWhyTrending(metrics: {
  velocity?: number;
  spike?: number;
  platforms?: number;
  freshness?: number;
  breakout?: boolean;
  creators?: number;
  acceleration?: number;
  geoSpread?: number;
}): string[] {
  const why: string[] = [];
  if (metrics.breakout) why.push('Breakout growth signal detected from source metrics');
  if ((metrics.spike ?? 0) >= 50)
    why.push(`Spike score ${Math.round(metrics.spike!)} from mention velocity`);
  if ((metrics.velocity ?? 0) >= 1.5) why.push(`Creator velocity ${metrics.velocity!.toFixed(2)}x`);
  if ((metrics.acceleration ?? 0) > 2)
    why.push(`Positive acceleration ${metrics.acceleration!.toFixed(1)}`);
  if ((metrics.platforms ?? 0) >= 2)
    why.push(`Cross-platform presence on ${metrics.platforms} sources`);
  if ((metrics.freshness ?? 0) >= 70)
    why.push(`High freshness (${Math.round(metrics.freshness!)})`);
  if ((metrics.creators ?? 0) >= 100)
    why.push(`${metrics.creators!.toLocaleString()} creators in window`);
  if ((metrics.geoSpread ?? 0) >= 3) why.push(`Geo spread across ${metrics.geoSpread} regions`);
  if (why.length === 0) why.push('Ranked from available engagement and freshness metrics');
  return why.slice(0, 6);
}

export function clusterTrends<T extends { id: string; title: string; nemoScore: number }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (isEvergreenTopic(item.title)) continue;
    const key = normalizeClusterKey(item.title);
    const list = groups.get(key) || [];
    list.push(item);
    groups.set(key, list);
  }
  return groups;
}

export function pickCanonical<T extends { nemoScore: number; title: string }>(group: T[]): T {
  return [...group].sort((a, b) => b.nemoScore - a.nemoScore || a.title.length - b.title.length)[0];
}
