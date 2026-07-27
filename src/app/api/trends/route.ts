import { NextRequest, NextResponse } from 'next/server';
import { getTrends, runTrendIngestion } from '@/lib/trends/store';

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get('refresh') === '1';
  const result = await getTrends({ refresh });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get('x-cron-secret');

  if (cronSecret && headerSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runTrendIngestion({ useServiceRole: Boolean(cronSecret) });
  return NextResponse.json({
    ok: true,
    count: result.trends.length,
    source: result.source,
    collectedAt: result.collectedAt,
  });
}
