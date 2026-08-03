import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdminSession } from '@/lib/admin/auth';

const PLAN_MRR: Record<string, number> = { pro: 999, agency: 4999 };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const now = Date.now();
      const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const since14d = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
      const sinceToday = new Date();
      sinceToday.setHours(0, 0, 0, 0);

      const [
        { count: totalUsers },
        { count: proUsers },
        { count: agencyUsers },
        { count: events24h },
        { count: aiCalls24h },
        { count: activeSessionsToday },
        { data: recentUsers },
        { data: events14d },
        { data: expiredConnections },
        { data: highAiUsers },
      ] = await Promise.all([
        admin.from('profiles').select('*', { count: 'exact', head: true }),
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'agency'),
        admin
          .from('user_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', since24h),
        admin
          .from('user_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', since24h)
          .eq('event_category', 'ai'),
        admin
          .from('user_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', sinceToday.toISOString()),
        admin
          .from('profiles')
          .select('id, email, full_name, plan, created_at, onboarding_complete, status')
          .order('created_at', { ascending: false })
          .limit(12),
        admin
          .from('user_events')
          .select('created_at, event_category')
          .gte('created_at', since14d)
          .limit(5000),
        admin
          .from('user_connections')
          .select('user_id, platform, metadata, connected_at')
          .limit(200),
        admin
          .from('user_events')
          .select('user_id')
          .eq('event_category', 'ai')
          .gte('created_at', since24h)
          .limit(2000),
      ]);

      const pro = proUsers ?? 0;
      const agency = agencyUsers ?? 0;
      const estMrr = pro * PLAN_MRR.pro + agency * PLAN_MRR.agency;

      const usageByDay: Record<string, { date: string; events: number; ai: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        const key = dayKey(d);
        usageByDay[key] = { date: key.slice(5), events: 0, ai: 0 };
      }
      for (const row of events14d ?? []) {
        const key = dayKey(new Date(row.created_at));
        if (usageByDay[key]) {
          usageByDay[key].events += 1;
          if (row.event_category === 'ai') usageByDay[key].ai += 1;
        }
      }

      const aiCountByUser: Record<string, number> = {};
      for (const row of highAiUsers ?? []) {
        if (!row.user_id) continue;
        aiCountByUser[row.user_id] = (aiCountByUser[row.user_id] || 0) + 1;
      }
      const topAi = Object.entries(aiCountByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const attention: { type: string; label: string; href?: string }[] = [];
      for (const [uid, count] of topAi) {
        if (count >= 5) {
          attention.push({
            type: 'ai',
            label: `High AI usage: ${count} calls/24h`,
            href: `/admin/users/${uid}`,
          });
        }
      }
      for (const conn of expiredConnections ?? []) {
        const meta = (conn.metadata ?? {}) as Record<string, unknown>;
        if (meta.expired === true || meta.status === 'expired') {
          attention.push({
            type: 'oauth',
            label: `Expired OAuth: ${conn.platform}`,
            href: `/admin/users/${conn.user_id}`,
          });
        }
      }

      let supabaseOk = true;
      try {
        const { error } = await admin
          .from('profiles')
          .select('id', { head: true, count: 'exact' })
          .limit(1);
        if (error) supabaseOk = false;
      } catch {
        supabaseOk = false;
      }

      return NextResponse.json({
        stats: {
          totalUsers: totalUsers ?? 0,
          proUsers: pro,
          agencyUsers: agency,
          estMrr,
          activeToday: activeSessionsToday ?? 0,
          events24h: events24h ?? 0,
          aiCalls24h: aiCalls24h ?? 0,
        },
        health: {
          supabase: supabaseOk ? 'operational' : 'down',
          collectors: 'operational',
          api: 'operational',
        },
        recentSignups: recentUsers ?? [],
        usageChart: Object.values(usageByDay),
        attention: attention.slice(0, 8),
        source: 'supabase',
      });
    }
  }

  return NextResponse.json({ error: 'supabase_unavailable', source: null }, { status: 503 });
}
