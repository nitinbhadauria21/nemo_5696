import { NextRequest, NextResponse } from 'next/server';
import { getTrends, runTrendIngestion } from '@/lib/trends/store';
import { isProductionRuntime } from '@/lib/billing/catalogue';

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

export async function GET(request: NextRequest) {
  // Never trigger collectors from a public GET (quota / DoS). Ignore refresh=1.
  void request.nextUrl.searchParams.get('refresh');
  const result = await getTrends({ refresh: false });
  return NextResponse.json(result);
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
