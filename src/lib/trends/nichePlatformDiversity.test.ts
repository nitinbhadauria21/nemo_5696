import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TrendItem, TrendPlatform } from '../mockData';
import { applyTrendFilters } from './filters';
import { selectDashboardTrendsPreferring } from './trendingGate';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function makeTrend(
  overrides: Partial<TrendItem> & { id: string; platforms: TrendPlatform[]; title?: string }
): TrendItem {
  return {
    title: overrides.title || `Trend ${overrides.id}`,
    description: '',
    category: 'Fitness',
    niches: ['Fitness'],
    contentType: 'KEYWORD',
    nemoScore: 50,
    cvs: 40,
    ss: 40,
    cps: 20,
    freshness: 50,
    freshnessMultiplier: 1,
    velocity: 1.2,
    spike: 40,
    status: 'rising',
    lifecycle: 'rising',
    confidenceScore: 50,
    confidence: 'Moderate',
    mentions24h: 100,
    mentionsPrev24h: 50,
    creatorsCount: 10,
    creatorsLast6h: 2,
    creatorsLast24h: 6,
    creatorsLast72h: 10,
    hashtags: [],
    firstDetectedAt: hoursAgo(12),
    latestActivityAt: hoursAgo(1),
    sparklineData: [],
    timeAgo: '12h ago',
    isBookmarked: false,
    ...overrides,
  };
}

describe('selectDashboardTrendsPreferring', () => {
  it('fills missing platforms from fallback when preferred is Instagram-only', () => {
    const preferred = [
      makeTrend({
        id: 'ig1',
        platforms: ['instagram'],
        nemoScore: 80,
        firstDetectedAt: hoursAgo(6),
      }),
      makeTrend({
        id: 'ig2',
        platforms: ['instagram'],
        nemoScore: 70,
        firstDetectedAt: hoursAgo(8),
      }),
    ];
    const fallback = [
      ...preferred,
      makeTrend({
        id: 'yt1',
        platforms: ['youtube_shorts'],
        nemoScore: 60,
        firstDetectedAt: hoursAgo(48),
      }),
      makeTrend({
        id: 'tt1',
        platforms: ['tiktok'],
        nemoScore: 55,
        firstDetectedAt: hoursAgo(40),
      }),
      makeTrend({ id: 'go1', platforms: ['google'], nemoScore: 52, firstDetectedAt: hoursAgo(36) }),
    ];

    const selected = selectDashboardTrendsPreferring(preferred, fallback, {
      perPlatformK: 1,
      cap: 20,
    });
    const platforms = new Set(selected.flatMap((t) => t.platforms));

    assert.ok(platforms.has('instagram'), 'keeps in-window Instagram');
    assert.ok(platforms.has('youtube_shorts'), 'backfills YouTube Shorts');
    assert.ok(platforms.has('tiktok'), 'backfills TikTok');
    assert.ok(platforms.has('google'), 'backfills Google');
  });
});

describe('applyTrendFilters niche platform diversity', () => {
  it('returns multi-platform Fitness results when 24h window is Instagram-heavy', () => {
    const trends = [
      makeTrend({
        id: 'ig-fit',
        platforms: ['instagram'],
        nemoScore: 75,
        firstDetectedAt: hoursAgo(6),
        title: 'Gym morning routine',
      }),
      makeTrend({
        id: 'yt-fit',
        platforms: ['youtube_shorts'],
        nemoScore: 65,
        firstDetectedAt: hoursAgo(40),
        title: 'Football skills challenge',
      }),
      makeTrend({
        id: 'tt-fit',
        platforms: ['tiktok'],
        nemoScore: 58,
        firstDetectedAt: hoursAgo(50),
        title: 'Workout tips for beginners',
      }),
      makeTrend({
        id: 'fb-fit',
        platforms: ['facebook'],
        nemoScore: 54,
        firstDetectedAt: hoursAgo(30),
        title: 'NBA highlight reel',
      }),
    ];

    const filtered = applyTrendFilters(trends, {
      niche: ['Fitness'],
      timeframeHours: 24,
      neverBlankTopK: true,
      perPlatformK: 1,
      cap: 20,
    });

    const platforms = new Set(filtered.flatMap((t) => t.platforms));
    assert.ok(platforms.has('instagram'));
    assert.ok(platforms.has('youtube_shorts'), 'expected YT Shorts backfill within 72h');
    assert.ok(platforms.has('tiktok'), 'expected TikTok backfill within 72h');
    assert.ok(platforms.has('facebook'), 'expected Facebook backfill within 72h');
    assert.ok(filtered.some((t) => t.id === 'ig-fit'));
  });

  it('does not pull trends older than 72h for niche backfill', () => {
    const trends = [
      makeTrend({
        id: 'ig-new',
        platforms: ['instagram'],
        firstDetectedAt: hoursAgo(4),
        title: 'Yoga flow',
      }),
      makeTrend({
        id: 'yt-old',
        platforms: ['youtube_shorts'],
        firstDetectedAt: hoursAgo(96),
        title: 'Soccer drills',
      }),
    ];

    const filtered = applyTrendFilters(trends, {
      niche: ['Fitness'],
      timeframeHours: 24,
      neverBlankTopK: true,
      perPlatformK: 2,
      cap: 20,
    });

    assert.ok(filtered.some((t) => t.id === 'ig-new'));
    assert.equal(
      filtered.some((t) => t.id === 'yt-old'),
      false,
      '96h-old niche rows must stay excluded'
    );
  });
});
