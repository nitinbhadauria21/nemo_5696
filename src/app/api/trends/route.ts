import { NextRequest, NextResponse } from 'next/server';
import { getTrends, runTrendIngestion } from '@/lib/trends/store';
import { parseTimeframeParam } from '@/lib/trends/filters';
import { isProductionRuntime } from '@/lib/billing/catalogue';
import type { TrendPlatform } from '@/lib/mockData';

function authorizeCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Fail closed in production / Vercel
    return !isProductionRuntime();
  }
  const headerSecret = request.headers.get('x-cron-secret');
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  return headerSecret === cronSecret || bearer === cronSecret;
}

function splitCsv(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  // Never trigger collectors from a public GET (quota / DoS). Ignore refresh=1.
  const sp = request.nextUrl.searchParams;
  void sp.get('refresh');

  const niche = splitCsv(sp.get('niche') || sp.get('categories'));
  const platforms = splitCsv(sp.get('platforms')) as TrendPlatform[];
  const geo = splitCsv(sp.get('geo') || sp.get('countries'));
  const status = splitCsv(sp.get('status'));
  const q = sp.get('q') || sp.get('keyword') || '';
  const timeframeHours = parseTimeframeParam(sp.get('timeframe'));
  const sortBy = (sp.get('sortBy') || 'score') as
    'score' | 'recent' | 'rising' | 'freshness' | 'velocity' | 'acceleration';
  const page = Math.max(1, Number(sp.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') || 40)));

  const result = await getTrends({
    refresh: false,
    filters: {
      niche,
      platforms,
      geo,
      status,
      q,
      timeframeHours,
      sortBy,
      neverBlankTopK: true,
      lifecycleExclude: ['recycled'],
    },
  });

  const start = (page - 1) * pageSize;
  const pageTrends = result.trends.slice(start, start + pageSize);

  return NextResponse.json({
    trends: pageTrends,
    source: result.source === 'mock' || result.source === 'memory' ? 'cached' : 'live',
    collectedAt: result.collectedAt,
    lastIngestAt: result.lastIngestAt ?? result.collectedAt,
    total: result.trends.length,
    totalBeforeFilter: result.totalBeforeFilter,
    page,
    pageSize,
    nearRealtime: true,
  });
}

export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runTrendIngestion({ useServiceRole: true });
  return NextResponse.json({
    ok: true,
    count: result.trends.length,
    source: result.source,
    collectedAt: result.collectedAt,
    error: result.error ?? null,
  });
}
