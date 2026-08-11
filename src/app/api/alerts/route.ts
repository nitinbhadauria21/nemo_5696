import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) {
    return NextResponse.json({ rules: [], alerts: [] });
  }
  const [{ data: rules }, { data: alerts }] = await Promise.all([
    supabase
      .from('alert_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  return NextResponse.json({ rules: rules || [], alerts: alerts || [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const row = {
    user_id: user.id,
    name: String(body.name || 'Alert'),
    niche: body.niche || null,
    min_score: Number(body.minScore ?? 60),
    lifecycle_status: body.lifecycleStatus || null,
    require_cross_platform: Boolean(body.requireCrossPlatform),
    require_breakout: Boolean(body.requireBreakout),
    platforms: Array.isArray(body.platforms) ? body.platforms : [],
    enabled: body.enabled !== false,
    notify_browser: Boolean(body.notifyBrowser),
  };
  const { data, error } = await supabase.from('alert_rules').insert(row).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rule: data });
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (body.markRead) {
    await supabase.from('alerts').update({ read: true }).eq('id', id).eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name != null) patch.name = body.name;
  if (body.enabled != null) patch.enabled = body.enabled;
  if (body.minScore != null) patch.min_score = body.minScore;
  if (body.niche != null) patch.niche = body.niche;
  if (body.notifyBrowser != null) patch.notify_browser = body.notifyBrowser;

  const { data, error } = await supabase
    .from('alert_rules')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rule: data });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await supabase.from('alert_rules').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
