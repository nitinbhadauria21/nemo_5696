import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';
import { requireAdminSession } from '@/lib/admin/auth';

function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const plan = (request.nextUrl.searchParams.get('plan') || '').trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      let query = admin
        .from('profiles')
        .select(
          'id, email, full_name, plan, niches, platforms, onboarding_complete, connected_socials, created_at, updated_at, status, schedule, last_login_at, last_active_at'
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
      const summaries: Record<
        string,
        {
          active_ms_7d: number;
          active_ms_30d: number;
          script_gens_30d: number;
          scripts_saved_30d: number;
          last_login_at: string | null;
        }
      > = {};

      if (userIds.length > 0) {
        const [{ data: recent }, { data: connections }, { data: activity }] = await Promise.all([
          admin
            .from('user_events')
            .select('user_id, created_at')
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
            .limit(800),
          admin.from('user_connections').select('user_id').in('user_id', userIds),
          admin
            .from('user_activity_summary')
            .select(
              'user_id, active_ms_7d, active_ms_30d, script_gens_30d, scripts_saved_30d, last_login_at'
            )
            .in('user_id', userIds),
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
        for (const row of activity ?? []) {
          summaries[row.user_id] = {
            active_ms_7d: Number(row.active_ms_7d ?? 0),
            active_ms_30d: Number(row.active_ms_30d ?? 0),
            script_gens_30d: Number(row.script_gens_30d ?? 0),
            scripts_saved_30d: Number(row.scripts_saved_30d ?? 0),
            last_login_at: row.last_login_at ?? null,
          };
        }
      }

      // NEVER include password fields
      const enriched = users.map((u) => {
        const sum = summaries[u.id];
        const lastLogin = u.last_login_at || sum?.last_login_at || null;
        return {
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          plan: u.plan,
          niches: u.niches,
          platforms: u.platforms,
          onboarding_complete: u.onboarding_complete,
          connected_socials: u.connected_socials,
          created_at: u.created_at,
          updated_at: u.updated_at,
          status: u.status,
          schedule: u.schedule,
          last_login_at: lastLogin,
          last_active_at: u.last_active_at ?? lastEvents[u.id] ?? null,
          last_event_at: lastEvents[u.id] ?? null,
          linked_socials_count: connectionCounts[u.id] ?? (u.connected_socials?.length || 0),
          niches_count: Array.isArray(u.niches) ? u.niches.length : 0,
          active_ms_7d: sum?.active_ms_7d ?? 0,
          active_ms_30d: sum?.active_ms_30d ?? 0,
          time_spent_7d: formatDuration(sum?.active_ms_7d),
          time_spent_30d: formatDuration(sum?.active_ms_30d),
          script_gens_30d: sum?.script_gens_30d ?? 0,
          scripts_saved_30d: sum?.scripts_saved_30d ?? 0,
        };
      });

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
    last_login_at: null as string | null,
    last_active_at: null as string | null,
    created_at: u.joined,
    linked_socials_count: 0,
    niches_count: 0,
    status: 'active',
    active_ms_7d: 0,
    active_ms_30d: 0,
    time_spent_7d: '—',
    time_spent_30d: '—',
    script_gens_30d: 0,
    scripts_saved_30d: 0,
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
