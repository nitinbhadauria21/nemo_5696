import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runTrendIngestion } from '@/lib/trends/store';
import { isProductionRuntime } from '@/lib/billing/catalogue';

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  const adminEmail = (process.env.ADMIN_EMAIL || 'nitin.bhadauria23@gmail.com').toLowerCase();
  if (data.user.email.toLowerCase() !== adminEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .maybeSingle();
    if (!profile?.is_admin) return null;
  }
  return data.user;
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const action = request.nextUrl.searchParams.get('action') || 'get_weights';
  if (action === 'get_weights') {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 });
    const { data } = await admin
      .from('scoring_weights')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    return NextResponse.json({ weights: data || null });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get('x-cron-secret');
  const authOk =
    Boolean(user) ||
    (cronSecret && headerSecret === cronSecret) ||
    (!isProductionRuntime() && !cronSecret);

  if (!authOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || 'ingest');

  if (action === 'disable_provider' || action === 'enable_provider') {
    const platform = String(body.platform || '');
    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 });
    await admin.from('data_source_status').upsert({
      platform,
      enabled: action === 'enable_provider',
      status: action === 'enable_provider' ? 'active' : 'disabled',
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, platform, enabled: action === 'enable_provider' });
  }

  if (action === 'set_poll_interval') {
    const platform = String(body.platform || '');
    const minutes = Math.max(5, Math.min(1440, Number(body.minutes || 30)));
    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 });
    await admin.from('data_source_status').upsert({
      platform,
      poll_interval_minutes: minutes,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, platform, minutes });
  }

  if (action === 'set_weights') {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 });
    if (!user) {
      return NextResponse.json(
        { error: 'Admin user required for weight changes' },
        { status: 401 }
      );
    }
    const raw = (body.weights || {}) as Record<string, unknown>;
    const allowed = [
      'freshness',
      'velocity',
      'acceleration',
      'cross_platform',
      'engagement',
      'novelty',
      'creator',
      'persistence',
      'breakout_modifier',
      'geo_spread_modifier',
    ] as const;
    const weights: Record<string, number> = {};
    for (const key of allowed) {
      if (raw[key] != null && Number.isFinite(Number(raw[key]))) {
        weights[key] = Number(raw[key]);
      }
    }
    await admin.from('scoring_weights').upsert({
      id: 'default',
      ...weights,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });
    return NextResponse.json({ ok: true });
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
