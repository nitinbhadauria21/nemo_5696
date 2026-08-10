import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isProductionRuntime } from '@/lib/billing/catalogue';

function authorizeCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return !isProductionRuntime();
  }
  const headerSecret = request.headers.get('x-cron-secret');
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  return headerSecret === cronSecret || bearer === cronSecret;
}

async function handleRefresh(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 503 });
  }

  const dayParam = request.nextUrl.searchParams.get('day');
  const targetDay = dayParam || new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const { data, error } = await admin.rpc('refresh_daily_metrics', {
    target_day: targetDay,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, day: targetDay, row: data });
}

export async function GET(request: NextRequest) {
  return handleRefresh(request);
}

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}
