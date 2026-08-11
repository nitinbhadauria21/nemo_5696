/**
 * Unit tests: brief scoring, freshness, 30d reject, clustering, filters.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyBriefScore,
  classifyLifecycle,
  isEvergreenTopic,
  normalizeClusterKey,
  clusterTrends,
  pickCanonical,
  HARD_REJECT_HOURS,
  SEVEN_DAY_PENALTY_HOURS,
  computeMultiWindowSpike,
  computeAcceleration,
  buildWhyTrending,
  deriveVelocitiesFromSnapshots,
} from '../signals/briefScoring';
import { applyTrendFilters, collapseToCanonicalCards } from '../trends/filters';
import type { TrendItem } from '../mockData';

function baseTrend(overrides: Partial<TrendItem> = {}): TrendItem {
  return {
    id: 't1',
    title: 'Claude Agents',
    category: 'AI',
    status: 'rising',
    lifecycle: 'rising',
    nemoScore: 70,
    cvs: 60,
    ss: 55,
    cps: 40,
    freshness: 80,
    freshnessMultiplier: 0.8,
    platforms: ['google', 'youtube'],
    creatorsCount: 100,
    mentions24h: 1000,
    mentionsPrev24h: 200,
    creatorsLast6h: 20,
    creatorsLast24h: 50,
    creatorsLast72h: 100,
    sparklineData: [1, 2, 3],
    timeAgo: '2h ago',
    firstDetectedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    hashtags: ['#AI'],
    description: 'test',
    isBookmarked: false,
    velocity: 2,
    spike: 50,
    acceleration: 3,
    contentType: 'TOPIC',
    geoRegions: ['US', 'GLOBAL'],
    ...overrides,
  };
}

describe('brief scoring', () => {
  it('freshness-heavy score beats stale high engagement', () => {
    const fresh = applyBriefScore({
      freshness: 95,
      velocity: 40,
      acceleration: 2,
      crossPlatform: 40,
      engagement: 40,
      novelty: 80,
      creator: 40,
      persistence: 20,
      breakout: false,
      geoSpread: 1,
      ageHours: 2,
      platformCount: 2,
    });
    const stale = applyBriefScore({
      freshness: 20,
      velocity: 90,
      acceleration: 0,
      crossPlatform: 80,
      engagement: 90,
      novelty: 10,
      creator: 80,
      persistence: 90,
      breakout: false,
      geoSpread: 1,
      ageHours: SEVEN_DAY_PENALTY_HOURS + 10,
      platformCount: 3,
    });
    assert.ok(fresh.score > stale.score);
    assert.equal(stale.sevenDayPenalty, true);
  });

  it('rejects trends older than 30 days', () => {
    const r = applyBriefScore({
      freshness: 10,
      velocity: 90,
      acceleration: 10,
      crossPlatform: 90,
      engagement: 90,
      novelty: 10,
      creator: 90,
      persistence: 90,
      breakout: true,
      geoSpread: 5,
      ageHours: HARD_REJECT_HOURS + 1,
    });
    assert.equal(r.rejected30d, true);
    assert.equal(r.score, 0);
  });

  it('breakout modifier increases score', () => {
    const base = {
      freshness: 70,
      velocity: 60,
      acceleration: 5,
      crossPlatform: 50,
      engagement: 50,
      novelty: 60,
      creator: 50,
      persistence: 40,
      geoSpread: 1,
      ageHours: 6,
      platformCount: 2,
    };
    const a = applyBriefScore({ ...base, breakout: false });
    const b = applyBriefScore({ ...base, breakout: true });
    assert.ok(b.score > a.score);
  });

  it('multi-window spike is capped', () => {
    const s = computeMultiWindowSpike({
      mentions_1h: 100000,
      mentions_6h: 100000,
      mentions_24h: 100000,
      prior_1h: 1,
      prior_6h: 1,
      prior_24h: 1,
    });
    assert.ok(s <= 100);
  });

  it('acceleration can be negative/zero', () => {
    assert.equal(computeAcceleration(5, 5), 0);
    assert.ok(computeAcceleration(3, 8) < 0);
  });
});

describe('lifecycle + evergreen + cluster', () => {
  it('classifies breakout', () => {
    assert.equal(
      classifyLifecycle({
        nemoScore: 80,
        velocity: 3,
        acceleration: 8,
        ageHours: 10,
        breakout: true,
        platforms: 3,
      }),
      'breakout'
    );
  });

  it('suppresses evergreen niche names', () => {
    assert.equal(isEvergreenTopic('AI'), true);
    assert.equal(isEvergreenTopic('Fitness'), true);
    assert.equal(isEvergreenTopic('Claude Agents Launch'), false);
  });

  it('clusters aliases (#Tag / tag)', () => {
    assert.equal(normalizeClusterKey('#ClaudeAI'), normalizeClusterKey('claudeai'));
    assert.equal(normalizeClusterKey('Claude AI'), normalizeClusterKey('claude ai'));
    const groups = clusterTrends([
      { id: '1', title: '#ClaudeAI', nemoScore: 50 },
      { id: '2', title: 'claudeai', nemoScore: 80 },
      { id: '4', title: 'Unrelated Topic XYZ', nemoScore: 40 },
    ]);
    const claude = groups.get(normalizeClusterKey('claudeai'));
    assert.ok(claude && claude.length >= 2);
    assert.equal(pickCanonical(claude!).id, '2');
  });
});

describe('filters', () => {
  it('does not silently restore unfiltered tops when empty', () => {
    const trends = [
      baseTrend({ id: 'a', category: 'AI', platforms: ['youtube'] }),
      baseTrend({ id: 'b', category: 'Finance', platforms: ['reddit'], title: 'UPI boom' }),
    ];
    const filtered = applyTrendFilters(trends, {
      niche: ['Gaming'],
      timeframeHours: 24,
      neverBlankTopK: true,
    });
    assert.equal(filtered.length, 0);
  });

  it('geo GLOBAL wildcard matches; untagged excluded when geo active', () => {
    const trends = [
      baseTrend({ id: 'g', geoRegions: ['GLOBAL'] }),
      baseTrend({ id: 'u', geoRegions: [] }),
      baseTrend({ id: 'in', geoRegions: ['IN'] }),
    ];
    const filtered = applyTrendFilters(trends, {
      geo: ['US'],
      timeframeHours: 24,
      neverBlankTopK: false,
    });
    const ids = filtered.map((t) => t.id);
    assert.ok(ids.includes('g'));
    assert.ok(!ids.includes('u'));
    assert.ok(!ids.includes('in'));
  });

  it('why trending is metrics-only', () => {
    const why = buildWhyTrending({
      velocity: 2,
      spike: 60,
      platforms: 3,
      freshness: 80,
      breakout: true,
    });
    assert.ok(why.every((w) => !/hallucin|maybe|probably/i.test(w)));
    assert.ok(why.length >= 2);
  });

  it('24h activity window uses latestActivityAt', () => {
    const recent = baseTrend({
      id: 'recent',
      firstDetectedAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
      latestActivityAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    });
    const stale = baseTrend({
      id: 'stale',
      firstDetectedAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
      latestActivityAt: new Date(Date.now() - 80 * 3600 * 1000).toISOString(),
    });
    const filtered = applyTrendFilters([recent, stale], {
      timeframeHours: 24,
      neverBlankTopK: false,
    });
    const ids = filtered.map((t) => t.id);
    assert.ok(ids.includes('recent'));
    assert.ok(!ids.includes('stale'));
  });

  it('youtube filter includes youtube_shorts', () => {
    const shorts = baseTrend({
      id: 'shorts',
      platforms: ['youtube_shorts'],
      title: 'Shorts Dance Challenge',
    });
    const filtered = applyTrendFilters([shorts], {
      platforms: ['youtube'],
      timeframeHours: 24,
      neverBlankTopK: false,
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'shorts');
  });

  it('collapses cluster aliases to one canonical card', () => {
    const a = baseTrend({
      id: 'a',
      title: '#ClaudeAI',
      nemoScore: 50,
      platforms: ['youtube'],
      clusterId: 'cl_claudeai',
    });
    const b = baseTrend({
      id: 'b',
      title: 'claudeai',
      nemoScore: 80,
      platforms: ['tiktok'],
      clusterId: 'cl_claudeai',
    });
    const collapsed = collapseToCanonicalCards([a, b]);
    assert.equal(collapsed.length, 1);
    assert.equal(collapsed[0].id, 'b');
    assert.ok(collapsed[0].platforms.includes('youtube'));
    assert.ok(collapsed[0].platforms.includes('tiktok'));
    assert.equal(collapsed[0].clusterSize, 2);
  });

  it('excludes recycled lifecycle from feed', () => {
    const recycled = baseTrend({ id: 'r', lifecycle: 'recycled', title: 'Old Recycled Thing' });
    const live = baseTrend({ id: 'l', lifecycle: 'rising', title: 'Fresh Topic XYZ' });
    const filtered = applyTrendFilters([recycled, live], {
      timeframeHours: 24,
      neverBlankTopK: false,
    });
    assert.deepEqual(
      filtered.map((t) => t.id),
      ['l']
    );
  });
});

describe('snapshot velocities', () => {
  it('derives velocities from consecutive snapshots', () => {
    const now = Date.now();
    const derived = deriveVelocitiesFromSnapshots([
      {
        at: new Date(now - 6 * 3600 * 1000).toISOString(),
        score: 40,
        mentions: 100,
        creatorVelocity: 20,
      },
      {
        at: new Date(now - 3 * 3600 * 1000).toISOString(),
        score: 60,
        mentions: 200,
        creatorVelocity: 40,
      },
      {
        at: new Date(now).toISOString(),
        score: 90,
        mentions: 400,
        creatorVelocity: 50,
      },
    ]);
    assert.ok(derived.peakScore === 90);
    assert.ok(derived.mentionVelocity >= 1.5);
    assert.ok(derived.scoreVelocity >= 1);
    assert.ok(derived.peakVelocity >= derived.scoreVelocity);
  });
});
