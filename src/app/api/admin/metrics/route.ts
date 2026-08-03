import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

const PLAN_MRR: Record<string, number> = { pro: 999, agency: 4999 };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rangeParam = request.nextUrl.searchParams.get('range') || '30d';
  const days = rangeParam === '7d' ? 7 : rangeParam === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const [
        { count: totalUsers },
        { count: proUsers },
        { count: agencyUsers },
        { count: onboarded },
        { data: profiles },
        { data: events },
        { data: connections },
      ] = await Promise.all([
        admin.from('profiles').select('*', { count: 'exact', head: true }),
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'agency'),
        admin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('onboarding_complete', true),
        admin
          .from('profiles')
          .select('id, plan, onboarding_complete, created_at')
          .gte('created_at', since),
        admin
          .from('user_events')
          .select('user_id, event_name, event_category, created_at')
          .gte('created_at', since)
          .limit(8000),
        admin.from('user_connections').select('platform'),
      ]);

      const total = totalUsers ?? 0;
      const pro = proUsers ?? 0;
      const agency = agencyUsers ?? 0;
      const paying = pro + agency;
      const estMrr = pro * PLAN_MRR.pro + agency * PLAN_MRR.agency;
      const arpu = total > 0 ? Math.round(estMrr / total) : 0;
      const freeToPaid = total > 0 ? Math.round((paying / total) * 1000) / 10 : 0;
      const onboardingRate = total > 0 ? Math.round(((onboarded ?? 0) / total) * 100) : 0;

      const growthMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        growthMap[dayKey(d)] = 0;
      }
      for (const p of profiles ?? []) {
        const k = dayKey(new Date(p.created_at));
        if (k in growthMap) growthMap[k] += 1;
      }
      const growth = Object.entries(growthMap).map(([date, signups]) => ({
        date: date.slice(5),
        signups,
      }));

      const userIds = new Set((events ?? []).map((e) => e.user_id).filter(Boolean) as string[]);
      const signupUsers = new Set((profiles ?? []).map((p) => p.id));
      // Funnel uses all profiles + event names across range
      const allProfilesRes = await admin.from('profiles').select('id, onboarding_complete, plan');
      const allProfiles = allProfilesRes.data ?? [];

      const usersWithTrend = new Set<string>();
      const usersWithAi = new Set<string>();
      for (const e of events ?? []) {
        if (!e.user_id) continue;
        const name = (e.event_name || '').toLowerCase();
        if (name.includes('trend') || e.event_category === 'trends') usersWithTrend.add(e.user_id);
        if (e.event_category === 'ai' || name.includes('ai.')) usersWithAi.add(e.user_id);
      }

      const funnel = [
        { step: 'Signup', count: allProfiles.length || total },
        {
          step: 'Onboard complete',
          count: allProfiles.filter((p) => p.onboarding_complete).length,
        },
        { step: 'First trend view', count: usersWithTrend.size },
        { step: 'First AI', count: usersWithAi.size },
        {
          step: 'Paid',
          count: allProfiles.filter((p) => p.plan === 'pro' || p.plan === 'agency').length,
        },
      ];

      const platformVolume: Record<string, number> = {};
      for (const c of connections ?? []) {
        const p = (c.platform || 'unknown').toLowerCase();
        platformVolume[p] = (platformVolume[p] || 0) + 1;
      }
      for (const e of events ?? []) {
        if (e.event_category === 'page' || e.event_category === 'trends') {
          // soft bump from events isn't platform-specific; skip
        }
      }

      const planMix = [
        { name: 'Free', value: Math.max(0, total - paying), mrr: 0 },
        { name: 'Pro', value: pro, mrr: pro * PLAN_MRR.pro },
        { name: 'Agency', value: agency, mrr: agency * PLAN_MRR.agency },
      ];

      return NextResponse.json({
        range: rangeParam,
        kpis: {
          estMrr,
          arpu,
          freeToPaidPct: freeToPaid,
          onboardingRate,
          totalUsers: total,
          payingUsers: paying,
          activeEventUsers: userIds.size,
          newSignupsInRange: signupUsers.size,
        },
        growth,
        funnel,
        platformVolume: Object.entries(platformVolume).map(([name, count]) => ({ name, count })),
        planMix,
        source: 'supabase',
      });
    }
  }

  return NextResponse.json({
    range: rangeParam,
    kpis: {
      estMrr: 6997,
      arpu: 350,
      freeToPaidPct: 12.5,
      onboardingRate: 64,
      totalUsers: 20,
      payingUsers: 3,
      activeEventUsers: 8,
      newSignupsInRange: 5,
    },
    growth: Array.from({ length: days }, (_, i) => ({
      date: `D${i + 1}`,
      signups: Math.round(Math.random() * 4),
    })),
    funnel: [
      { step: 'Signup', count: 20 },
      { step: 'Onboard complete', count: 14 },
      { step: 'First trend view', count: 10 },
      { step: 'First AI', count: 6 },
      { step: 'Paid', count: 3 },
    ],
    platformVolume: [
      { name: 'youtube', count: 4 },
      { name: 'instagram', count: 3 },
      { name: 'linkedin', count: 2 },
    ],
    planMix: [
      { name: 'Free', value: 17, mrr: 0 },
      { name: 'Pro', value: 2, mrr: 1998 },
      { name: 'Agency', value: 1, mrr: 4999 },
    ],
    source: 'mock',
  });
}
