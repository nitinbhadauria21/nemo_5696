import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';
import { requireAdminSession } from '@/lib/admin/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  const { id } = await context.params;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const [
        { data: profile, error },
        { data: connections },
        { data: events },
        { count: eventCount },
        { data: scripts },
        { data: searches },
        { data: carousels },
      ] = await Promise.all([
        admin.from('profiles').select('*').eq('id', id).maybeSingle(),
        admin
          .from('user_connections')
          .select('*')
          .eq('user_id', id)
          .order('connected_at', { ascending: false }),
        admin
          .from('user_events')
          .select('id, event_name, event_category, page_path, properties, created_at, session_id')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(40),
        admin.from('user_events').select('*', { count: 'exact', head: true }).eq('user_id', id),
        admin
          .from('script_generations')
          .select('id, topic, success, created_at, viral_score')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(30),
        admin
          .from('search_queries')
          .select('id, query, result_count, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(30),
        admin
          .from('carousel_projects')
          .select('id, topic, exported, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const lastEvent = events?.[0]?.created_at ?? null;
      const idleMs = lastEvent ? Date.now() - new Date(lastEvent).getTime() : null;
      const activityStatus = idleMs !== null && idleMs < 24 * 60 * 60 * 1000 ? 'active' : 'idle';

      // Strip any accidental sensitive keys from profile payload
      const safeProfile = { ...profile } as Record<string, unknown>;
      delete safeProfile.password;
      delete safeProfile.encrypted_password;

      return NextResponse.json({
        profile: safeProfile,
        connections: connections ?? [],
        events: events ?? [],
        scripts: scripts ?? [],
        searches: searches ?? [],
        carousels: carousels ?? [],
        meta: {
          eventCount: eventCount ?? 0,
          lastEventAt: lastEvent,
          activityStatus,
        },
        source: 'supabase',
      });
    }
  }

  const mock = MOCK_ADMIN_USERS.find((u) => u.id === id);
  if (!mock) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    profile: {
      id: mock.id,
      email: mock.email,
      full_name: mock.name,
      plan: String(mock.plan).toLowerCase(),
      niches: [],
      platforms: [],
      onboarding_complete: false,
      connected_socials: [],
      status: 'active',
      created_at: mock.joined,
    },
    connections: [],
    events: [],
    meta: { eventCount: 0, lastEventAt: null, activityStatus: 'idle' },
    source: 'mock',
  });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status =
    body.status === 'suspended' ? 'suspended' : body.status === 'active' ? 'active' : null;
  if (!status) {
    return NextResponse.json({ error: 'status must be active or suspended' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, status, source: 'mock' });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data, error } = await admin
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ ok: true, profile: data, source: 'supabase' });
}
