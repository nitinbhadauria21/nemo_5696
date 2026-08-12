import { test, expect } from '@playwright/test';
import { fetchTrends, trendPlatformSet } from '../helpers/trends-api';

/**
 * Demo-path API checks (DEBUG_REPORT dry-run items 2, 3, 5, 6, 8, 9, 12).
 * Uses Playwright request fixture — no browser auth required.
 */
test.describe('Nemo trends API — demo path', () => {
  test('dashboard feed loads live trends', async ({ request }) => {
    await test.step('GET /api/trends default window', async () => {
      const body = await fetchTrends(request, 'timeframe=24h&pageSize=40');
      expect(body.source).toBe('live');
      expect(body.trends.length).toBeGreaterThan(0);
      expect(body.total).toBeGreaterThan(0);
      expect(body.lastIngestAt || body.collectedAt).toBeTruthy();
    });
  });

  test('niche filter changes results (Fitness vs AI)', async ({ request }) => {
    const ai = await fetchTrends(request, 'niche=AI&timeframe=24h');
    const fitness = await fetchTrends(request, 'niche=fitness&timeframe=24h');

    expect(ai.trends.length).toBeGreaterThan(0);
    expect(fitness.total).toBeGreaterThan(0);
    expect(fitness.total).toBeLessThan(ai.total);

    for (const t of fitness.trends) {
      const niches = t.niches?.length ? t.niches : [];
      expect(
        niches.some((n) => n.toLowerCase() === 'fitness'),
        `expected Fitness niche on ${t.id}`
      ).toBeTruthy();
    }
  });

  test('platform filter returns YouTube-only when platforms=youtube', async ({ request }) => {
    const body = await fetchTrends(request, 'platforms=youtube&timeframe=24h');
    expect(body.trends.length).toBeGreaterThan(0);

    const platforms = trendPlatformSet(body);
    for (const p of platforms) {
      expect(['youtube', 'youtube_shorts']).toContain(p);
    }
  });

  test('24h window honors firstDetectedAt (emergence, not ingest bump)', async ({ request }) => {
    const h24 = await fetchTrends(request, 'timeframe=24h&pageSize=80&sortBy=score');
    expect(h24.trends.length).toBeGreaterThan(0);

    const dayMs = 24 * 3600 * 1000;
    const now = Date.now();
    let checked = 0;
    for (const t of h24.trends) {
      const fd = Date.parse(t.firstDetectedAt || '');
      if (!Number.isFinite(fd)) continue;
      checked += 1;
      expect(now - fd, `${t.id} emerged within 24h`).toBeLessThanOrEqual(dayMs + 120_000);
    }
    expect(checked).toBeGreaterThan(0);
  });

  test('data sources are labeled honestly (not demo mode)', async ({ request }) => {
    const res = await request.get('/api/data-sources/status');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.demo).toBe(false);
    expect(Array.isArray(body.sources)).toBeTruthy();
    expect(body.sources.length).toBeGreaterThan(0);

    const reddit = body.sources.find((s: { platform: string }) => s.platform === 'reddit');
    expect(reddit?.label || reddit?.status).toMatch(/unavailable|Unavailable/i);
  });

  test('trend detail returns score and why trending', async ({ request }) => {
    const list = await fetchTrends(request, 'timeframe=24h&pageSize=1');
    const id = list.trends[0]?.id;
    expect(id).toBeTruthy();

    const res = await request.get(`/api/trends/${encodeURIComponent(id!)}`);
    expect(res.ok()).toBeTruthy();
    const detail = await res.json();
    expect(detail.trend?.nemoScore).toBeDefined();
    expect(detail.trend?.whyTrending?.length).toBeGreaterThan(0);
  });

  test('admin health rejects unauthenticated access', async ({ request }) => {
    const res = await request.get('/api/admin/health');
    expect(res.status()).toBe(401);
  });
});
