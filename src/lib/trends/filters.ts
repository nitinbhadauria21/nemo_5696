import type { TrendItem, TrendPlatform, LifecycleStatus } from '@/lib/mockData';
import { selectDashboardTrends } from './trendingGate';

export type TrendQueryFilters = {
  niche?: string[];
  timeframeHours?: number;
  platforms?: TrendPlatform[];
  geo?: string[];
  status?: string[];
  q?: string;
  sortBy?: 'score' | 'recent' | 'rising' | 'freshness' | 'velocity' | 'acceleration';
  lifecycleExclude?: LifecycleStatus[];
  /** Apply never-blank top-K after filters (default true for dashboard). */
  neverBlankTopK?: boolean;
  perPlatformK?: number;
  cap?: number;
};

function withinTimeframe(t: TrendItem, timeframeHours: number): boolean {
  const detected = Date.parse(t.firstDetectedAt || '');
  if (!Number.isFinite(detected) || detected <= 0) return true;
  return Date.now() - detected <= timeframeHours * 3600 * 1000;
}

function matchesGeo(t: TrendItem, countries: string[]): boolean {
  if (countries.length === 0) return true;
  const trendRegions = (t.geoRegions ?? []).map((r) => r.toUpperCase());
  // Untagged rows are excluded when a geo filter is active (no silent keep-all).
  if (trendRegions.length === 0) return false;
  // GLOBAL is a wildcard that matches any selected country filter.
  if (
    trendRegions.includes('GLOBAL') ||
    trendRegions.includes('WW') ||
    trendRegions.includes('WORLD')
  ) {
    return true;
  }
  return countries.some((code) => {
    const c = code.toUpperCase();
    return (
      trendRegions.includes(c) ||
      (c === 'GB' && trendRegions.includes('UK')) ||
      (c === 'UK' && trendRegions.includes('GB'))
    );
  });
}

function trendNiches(t: TrendItem): string[] {
  if (t.niches?.length) return t.niches;
  return t.category ? [t.category] : [];
}

function matchesStatus(t: TrendItem, statuses: string[]): boolean {
  if (statuses.length === 0) return true;
  const lifecycle = (t.lifecycle || t.status || '').toLowerCase();
  return statuses.some((s) => {
    const key = s.toLowerCase();
    if (key === lifecycle) return true;
    if (
      key === 'hot' &&
      (lifecycle === 'breakout' || lifecycle === 'trending' || t.status === 'hot')
    )
      return true;
    if (
      key === 'rising' &&
      (lifecycle === 'rising' || lifecycle === 'emerging' || t.status === 'rising')
    )
      return true;
    if (
      key === 'fading' &&
      (lifecycle === 'fading' || lifecycle === 'recycled' || t.status === 'fading')
    )
      return true;
    return false;
  });
}

/**
 * Apply user filters. Never restores unfiltered tops when empty.
 * Optional never-blank top-K runs AFTER filters only.
 */
export function applyTrendFilters(trends: TrendItem[], filters: TrendQueryFilters): TrendItem[] {
  const timeframeHours = filters.timeframeHours ?? 24;
  const niches = (filters.niche ?? []).filter((n) => n && n !== 'All');
  const platforms = filters.platforms ?? [];
  const geo = filters.geo ?? [];
  const statuses = filters.status ?? [];
  const q = (filters.q ?? '').trim().toLowerCase();
  const exclude = new Set(filters.lifecycleExclude ?? ['recycled']);

  let filtered = trends.filter((t) => {
    if (t.lifecycle && exclude.has(t.lifecycle)) return false;
    if (niches.length > 0) {
      const tn = trendNiches(t);
      if (!niches.some((n) => tn.includes(n))) return false;
    }
    if (platforms.length > 0 && !platforms.some((p) => t.platforms.includes(p))) return false;
    if (q) {
      const inTitle = t.title.toLowerCase().includes(q);
      const inDesc = (t.description || '').toLowerCase().includes(q);
      const inTags = (t.hashtags || []).some((h) => h.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inTags) return false;
    }
    if (!matchesGeo(t, geo)) return false;
    if (!matchesStatus(t, statuses)) return false;
    if (!withinTimeframe(t, timeframeHours)) return false;
    return true;
  });

  // Never-blank top-K AFTER filters only — never restore unfiltered set.
  if (filters.neverBlankTopK !== false && filtered.length > 0) {
    filtered = selectDashboardTrends(filtered, {
      perPlatformK: filters.perPlatformK,
      cap: filters.cap,
    });
  }

  const sortBy = filters.sortBy ?? 'score';
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'rising' || sortBy === 'velocity') return b.velocity - a.velocity;
    if (sortBy === 'acceleration') return (b.acceleration ?? 0) - (a.acceleration ?? 0);
    if (sortBy === 'freshness') return b.freshness - a.freshness;
    if (sortBy === 'recent') {
      return new Date(b.firstDetectedAt).getTime() - new Date(a.firstDetectedAt).getTime();
    }
    return b.nemoScore - a.nemoScore;
  });

  return filtered;
}

export function parseTimeframeParam(raw: string | null): number {
  if (!raw) return 24;
  const m = raw.match(/^(\d+)\s*h$/i);
  if (m) return Math.min(720, Math.max(1, Number(m[1])));
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.min(720, n);
  return 24;
}
