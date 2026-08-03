import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const plan = (request.nextUrl.searchParams.get('plan') || '').trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      let query = admin
        .from('profiles')
        .select(
          'id, email, full_name, plan, niches, platforms, onboarding_complete, connected_socials, created_at, updated_at, status, schedule'
        )
        .order('updated_at', { ascending: false })
        .limit(200);

      if (plan && plan !== 'all') {
        query = query.eq('plan', plan);
      }

      const [
        { data: profiles, error },
        { count: totalUsers },
        { count: proUsers },
        { count: agencyUsers },
        { count: freeUsers },
        { count: incompleteOnboarding },
        { count: events24h },
      ] = await Promise.all([
        query,
        admin.from('profiles').select('*', { count: 'exact', head: true }),
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'agency'),
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
        admin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('onboarding_complete', false),
        admin
          .from('user_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', since24h),
      ]);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      let users = profiles ?? [];
      if (q) {
        users = users.filter(
          (u) =>
            (u.email || '').toLowerCase().includes(q) ||
            (u.full_name || '').toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q)
        );
      }

      const userIds = users.map((u) => u.id);
      const lastEvents: Record<string, string> = {};
      const connectionCounts: Record<string, number> = {};

      if (userIds.length > 0) {
        const [{ data: recent }, { data: connections }] = await Promise.all([
          admin
            .from('user_events')
            .select('user_id, created_at')
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
            .limit(800),
          admin.from('user_connections').select('user_id').in('user_id', userIds),
        ]);

        for (const row of recent ?? []) {
          if (row.user_id && !lastEvents[row.user_id]) {
            lastEvents[row.user_id] = row.created_at;
          }
        }
        for (const row of connections ?? []) {
          if (row.user_id) {
            connectionCounts[row.user_id] = (connectionCounts[row.user_id] || 0) + 1;
          }
        }
      }

      const enriched = users.map((u) => ({
        ...u,
        last_event_at: lastEvents[u.id] ?? null,
        linked_socials_count: connectionCounts[u.id] ?? (u.connected_socials?.length || 0),
        niches_count: Array.isArray(u.niches) ? u.niches.length : 0,
      }));

      const total = totalUsers ?? 0;
      const paying = (proUsers ?? 0) + (agencyUsers ?? 0);

      return NextResponse.json({
        kpis: {
          totalUsers: total,
          payingUsers: paying,
          freeUsers: freeUsers ?? Math.max(0, total - paying),
          incompleteOnboarding: incompleteOnboarding ?? 0,
          events24h: events24h ?? 0,
          onboardingRate:
            total > 0 ? Math.round(((total - (incompleteOnboarding ?? 0)) / total) * 100) : 0,
          onboardedUsers: total - (incompleteOnboarding ?? 0),
        },
        users: enriched,
        source: 'supabase',
      });
    }
  }

  let mock = MOCK_ADMIN_USERS.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.name,
    plan: String(u.plan).toLowerCase(),
    niches: [] as string[],
    platforms: [] as string[],
    onboarding_complete: false,
    connected_socials: [] as string[],
    last_event_at: null as string | null,
    created_at: u.joined,
    linked_socials_count: 0,
    niches_count: 0,
    status: 'active',
  }));

  if (plan && plan !== 'all') mock = mock.filter((u) => u.plan === plan);
  if (q) {
    mock = mock.filter(
      (u) => u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    kpis: {
      totalUsers: MOCK_ADMIN_USERS.length,
      payingUsers: MOCK_ADMIN_USERS.filter((u) => u.plan === 'Pro' || u.plan === 'Agency').length,
      freeUsers: MOCK_ADMIN_USERS.filter((u) => u.plan === 'Free').length,
      incompleteOnboarding: 0,
      events24h: 0,
      onboardingRate: 0,
      onboardedUsers: 0,
    },
    users: mock,
    source: 'mock',
  });
}
