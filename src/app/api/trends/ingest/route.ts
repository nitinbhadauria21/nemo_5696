import { NextRequest, NextResponse } from 'next/server';
import { runTrendIngestion } from '@/lib/trends/store';
import { isProductionRuntime } from '@/lib/billing/catalogue';

function authorizeCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return !isProductionRuntime();
  }
  const headerSecret = request.headers.get('x-cron-secret');
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  return headerSecret === cronSecret || bearer === cronSecret;
}

async function handleIngest(request: NextRequest) {
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

/** Vercel Cron invokes GET with Bearer CRON_SECRET. */
export async function GET(request: NextRequest) {
  return handleIngest(request);
}

export async function POST(request: NextRequest) {
  return handleIngest(request);
}
