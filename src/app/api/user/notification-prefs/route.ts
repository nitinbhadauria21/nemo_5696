import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveUserId } from '@/lib/api/requireUser';

const DEFAULTS = {
  email_digest: true,
  trend_alerts: true,
  product_updates: false,
};

export async function GET() {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (!isSupabaseConfigured() || demo) {
    return NextResponse.json({ prefs: DEFAULTS, source: 'defaults' });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ prefs: DEFAULTS });

  const { data } = await supabase
    .from('notification_prefs')
    .select('email_digest, trend_alerts, product_updates')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({
    prefs: data ?? DEFAULTS,
    source: data ? 'supabase' : 'defaults',
  });
}

export async function PATCH(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (demo || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const row = {
    user_id: userId,
    email_digest: body.email_digest ?? body.emailDigest ?? DEFAULTS.email_digest,
    trend_alerts: body.trend_alerts ?? body.trendAlerts ?? DEFAULTS.trend_alerts,
    product_updates: body.product_updates ?? body.productUpdates ?? DEFAULTS.product_updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('notification_prefs')
    .upsert(row, { onConflict: 'user_id' })
    .select('email_digest, trend_alerts, product_updates')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prefs: data, ok: true });
}
