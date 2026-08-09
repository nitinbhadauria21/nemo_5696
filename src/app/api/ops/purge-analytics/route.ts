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

async function handlePurge(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 503 });
  }

  const { data, error } = await admin.rpc('purge_analytics_older_than_90_days');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    ok: true,
    deleted_events: Number(row?.deleted_events ?? 0),
    deleted_sessions: Number(row?.deleted_sessions ?? 0),
    deleted_searches: Number(row?.deleted_searches ?? 0),
  });
}

/** Vercel Cron invokes GET with Bearer CRON_SECRET. */
export async function GET(request: NextRequest) {
  return handlePurge(request);
}

export async function POST(request: NextRequest) {
  return handlePurge(request);
}
