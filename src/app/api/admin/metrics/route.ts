import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdminSession } from '@/lib/admin/auth';

const PLAN_MRR: Record<string, number> = { pro: 999, agency: 4999 };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function countBy<T>(rows: T[], keyFn: (r: T) => string | null | undefined) {
  const map: Record<string, number> = {};
  for (const r of rows) {
    const k = keyFn(r) || 'unknown';
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  const rangeParam = request.nextUrl.searchParams.get('range') || '30d';
  const days = rangeParam === '7d' ? 7 : rangeParam === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const since1d = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const generatedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const [
        { count: totalUsers },
        { count: proUsers },
        { count: agencyUsers },
        { count: onboarded },
        { data: profilesInRange },
        { data: allProfiles },
        { data: events },
        { data: connections },
        { data: scriptGens },
        { data: searches },
        { data: carousels },
        { data: aiRows },
        { data: sessions },
        { data: collectors },
        { data: dailyRows },
        { data: billingOrders },
        { data: activitySummaries },
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
        admin.from('profiles').select('id, email, full_name, plan, onboarding_complete, created_at, last_login_at, last_active_at'),
        admin
          .from('user_events')
          .select('user_id, event_name, event_category, created_at')
          .gte('created_at', since)
          .limit(10000),
        admin.from('user_connections').select('platform'),
        admin
          .from('script_generations')
          .select(
            'id, user_id, topic, audience_type, duration, language, success, copied, saved_script_id, created_at, viral_score'
          )
          .gte('created_at', since)
          .limit(5000),
        admin
          .from('search_queries')
          .select('id, query, result_count, source, created_at')
          .gte('created_at', since)
          .limit(5000),
        admin
          .from('carousel_projects')
          .select('id, topic, exported, export_count, created_at, slide_count')
          .gte('created_at', since)
          .limit(2000),
        admin
          .from('ai_generations')
          .select(
            'id, task, model_used, model, success, latency_ms, cost_usd_est, status, created_at, error'
          )
          .gte('created_at', since)
          .limit(8000),
        admin
          .from('user_sessions')
          .select('user_id, active_ms, page_count, started_at, last_seen_at')
          .gte('last_seen_at', since)
          .limit(5000),
        admin
          .from('collector_runs')
          .select('id, source, trend_count, started_at, finished_at, error, created_at')
          .order('created_at', { ascending: false })
          .limit(40),
        admin
          .from('daily_metrics')
          .select('*')
          .gte('day', since.slice(0, 10))
          .order('day', { ascending: true }),
        admin
          .from('billing_orders')
          .select('id, user_id, status, amount_paise, created_at, plan')
          .gte('created_at', since)
          .limit(2000),
        admin
          .from('user_activity_summary')
          .select(
            'user_id, active_ms_7d, active_ms_30d, script_gens_30d, scripts_saved_30d, last_login_at, last_active_at'
          )
          .limit(500),
      ]);

      const total = totalUsers ?? 0;
      const pro = proUsers ?? 0;
      const agency = agencyUsers ?? 0;
      const paying = pro + agency;
      const estMrr = pro * PLAN_MRR.pro + agency * PLAN_MRR.agency;
      const arpu = total > 0 ? Math.round(estMrr / total) : 0;
      const freeToPaid = total > 0 ? Math.round((paying / total) * 1000) / 10 : 0;
      const onboardingRate = total > 0 ? Math.round(((onboarded ?? 0) / total) * 100) : 0;

      // Growth series
      const growthMap: Record<string, number> = {};
      const payingGrowthMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const k = dayKey(d);
        growthMap[k] = 0;
        payingGrowthMap[k] = 0;
      }
      for (const p of profilesInRange ?? []) {
        const k = dayKey(new Date(p.created_at));
        if (k in growthMap) growthMap[k] += 1;
      }
      const growth = Object.entries(growthMap).map(([date, signups]) => ({
        date: date.slice(5),
        signups,
        paying: payingGrowthMap[date] || 0,
      }));

      // DAU / WAU from events
      const dauUsers = new Set(
        (events ?? [])
          .filter((e) => e.created_at >= since1d && e.user_id)
          .map((e) => e.user_id as string)
      );
      const wauUsers = new Set(
        (events ?? [])
          .filter((e) => e.created_at >= since7d && e.user_id)
          .map((e) => e.user_id as string)
      );

      // Funnel
      const usersWithTrend = new Set<string>();
      const usersWithAi = new Set<string>();
      const usersWithScript = new Set<string>();
      const usersWithCheckout = new Set<string>();
      for (const e of events ?? []) {
        if (!e.user_id) continue;
        const name = (e.event_name || '').toLowerCase();
        if (name.includes('trend') || e.event_category === 'trends') usersWithTrend.add(e.user_id);
        if (e.event_category === 'ai' || name.includes('ai.')) usersWithAi.add(e.user_id);
        if (name.includes('script') || e.event_category === 'script') usersWithScript.add(e.user_id);
        if (name.includes('checkout') || name.includes('billing') || e.event_category === 'billing') {
          usersWithCheckout.add(e.user_id);
        }
      }
      for (const s of scriptGens ?? []) {
        if (s.user_id) usersWithScript.add(s.user_id);
      }

      const profiles = allProfiles ?? [];
      const funnel = [
        { step: 'Signup', count: profiles.length || total },
        {
          step: 'Onboard complete',
          count: profiles.filter((p) => p.onboarding_complete).length,
        },
        { step: 'First trend view', count: usersWithTrend.size },
        { step: 'First AI', count: usersWithAi.size },
        { step: 'First script', count: usersWithScript.size },
        { step: 'Checkout', count: usersWithCheckout.size || (billingOrders ?? []).length },
        {
          step: 'Paid',
          count: profiles.filter((p) => p.plan === 'pro' || p.plan === 'agency').length,
        },
      ];

      const planMix = [
        { name: 'Free', value: Math.max(0, total - paying), mrr: 0 },
        { name: 'Pro', value: pro, mrr: pro * PLAN_MRR.pro },
        { name: 'Agency', value: agency, mrr: agency * PLAN_MRR.agency },
      ];

      // Scripts
      const gens = scriptGens ?? [];
      const scriptSuccess = gens.filter((g) => g.success).length;
      const scriptSaved = gens.filter((g) => g.saved_script_id).length;
      const scriptCopied = gens.filter((g) => g.copied).length;
      const scriptFail = gens.filter((g) => !g.success).length;
      const scriptSeriesMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        scriptSeriesMap[dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000))] = 0;
      }
      for (const g of gens) {
        const k = dayKey(new Date(g.created_at));
        if (k in scriptSeriesMap) scriptSeriesMap[k] += 1;
      }
      const topTopics = countBy(gens, (g) => (g.topic || '').slice(0, 80) || null)
        .filter((t) => t.name !== 'unknown')
        .slice(0, 10);
      const scripts = {
        series: Object.entries(scriptSeriesMap).map(([date, count]) => ({
          date: date.slice(5),
          count,
        })),
        mix: {
          audience: countBy(gens, (g) => g.audience_type).slice(0, 8),
          duration: countBy(gens, (g) => g.duration).slice(0, 8),
          language: countBy(gens, (g) => g.language).slice(0, 8),
        },
        topTopics,
        rates: {
          total: gens.length,
          successPct: gens.length ? Math.round((scriptSuccess / gens.length) * 1000) / 10 : 0,
          savePct: gens.length ? Math.round((scriptSaved / gens.length) * 1000) / 10 : 0,
          copyPct: gens.length ? Math.round((scriptCopied / gens.length) * 1000) / 10 : 0,
          failPct: gens.length ? Math.round((scriptFail / gens.length) * 1000) / 10 : 0,
        },
      };

      // Keywords
      const searchRows = searches ?? [];
      const keywordSeriesMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        keywordSeriesMap[dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000))] = 0;
      }
      const queryAgg: Record<string, { count: number; results: number[] }> = {};
      for (const s of searchRows) {
        const k = dayKey(new Date(s.created_at));
        if (k in keywordSeriesMap) keywordSeriesMap[k] += 1;
        const q = (s.query || '').toLowerCase().trim();
        if (!q) continue;
        if (!queryAgg[q]) queryAgg[q] = { count: 0, results: [] };
        queryAgg[q].count += 1;
        if (typeof s.result_count === 'number') queryAgg[q].results.push(s.result_count);
      }
      const topQueries = Object.entries(queryAgg)
        .map(([query, v]) => ({
          query,
          count: v.count,
          avgResults:
            v.results.length > 0
              ? Math.round((v.results.reduce((a, b) => a + b, 0) / v.results.length) * 10) / 10
              : null,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
      const zeroResult = Object.entries(queryAgg)
        .filter(([, v]) => v.results.length > 0 && v.results.every((r) => r === 0))
        .map(([query, v]) => ({ query, count: v.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      const keywords = {
        top: topQueries,
        zeroResult,
        series: Object.entries(keywordSeriesMap).map(([date, count]) => ({
          date: date.slice(5),
          count,
        })),
        total: searchRows.length,
      };

      // Carousel
      const carRows = carousels ?? [];
      const exported = carRows.filter((c) => c.exported).length;
      const carousel = {
        kpis: {
          creates: carRows.length,
          exports: exported,
          exportRate: carRows.length ? Math.round((exported / carRows.length) * 1000) / 10 : 0,
        },
        mix: [
          { name: 'Exported', value: exported },
          { name: 'Not exported', value: Math.max(0, carRows.length - exported) },
        ],
        recent: carRows.slice(0, 12).map((c) => ({
          id: c.id,
          topic: c.topic,
          exported: c.exported,
          slideCount: c.slide_count,
          createdAt: c.created_at,
        })),
      };

      // AI ops
      const ai = aiRows ?? [];
      const latencies = ai
        .map((a) => a.latency_ms)
        .filter((n): n is number => typeof n === 'number')
        .sort((a, b) => a - b);
      const aiSuccess = ai.filter((a) => a.success).length;
      const aiCost = ai.reduce((s, a) => s + Number(a.cost_usd_est ?? 0), 0);
      const aiSeriesMap: Record<string, { total: number; errors: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        aiSeriesMap[dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000))] = {
          total: 0,
          errors: 0,
        };
      }
      for (const a of ai) {
        const k = dayKey(new Date(a.created_at));
        if (k in aiSeriesMap) {
          aiSeriesMap[k].total += 1;
          if (!a.success) aiSeriesMap[k].errors += 1;
        }
      }
      const aiSection = {
        byTask: countBy(ai, (a) => a.task || 'unknown').slice(0, 10),
        byModel: countBy(ai, (a) => a.model_used || a.model || 'unknown').slice(0, 10),
        latency: {
          p50: percentile(latencies, 50),
          p95: percentile(latencies, 95),
          avg: latencies.length
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : null,
        },
        series: Object.entries(aiSeriesMap).map(([date, v]) => ({
          date: date.slice(5),
          calls: v.total,
          errors: v.errors,
        })),
        errors: ai
          .filter((a) => !a.success)
          .slice(0, 15)
          .map((a) => ({
            task: a.task,
            model: a.model_used || a.model,
            error: a.error || a.status,
            createdAt: a.created_at,
          })),
        cost: Math.round(aiCost * 10000) / 10000,
        successPct: ai.length ? Math.round((aiSuccess / ai.length) * 1000) / 10 : 0,
        total: ai.length,
        fallbackShare: 0,
      };

      // Engagement
      const sess = sessions ?? [];
      const totalActiveMs = sess.reduce((s, r) => s + Number(r.active_ms ?? 0), 0);
      const sessionUsers = new Set(sess.map((s) => s.user_id).filter(Boolean));
      const avgSessionMs =
        sess.length > 0 ? Math.round(totalActiveMs / sess.length) : 0;
      const pagesPerSession =
        sess.length > 0
          ? Math.round(
              (sess.reduce((s, r) => s + Number(r.page_count ?? 0), 0) / sess.length) * 10
            ) / 10
          : 0;

      // Retention approx: users active on day0 cohort still active D1/D7/D30
      const cohortStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const cohortUsers = new Set(
        (profilesInRange ?? []).map((p) => p.id)
      );
      const activeByUserDays: Record<string, Set<string>> = {};
      for (const e of events ?? []) {
        if (!e.user_id) continue;
        if (!activeByUserDays[e.user_id]) activeByUserDays[e.user_id] = new Set();
        activeByUserDays[e.user_id].add(dayKey(new Date(e.created_at)));
      }
      let d1 = 0;
      let d7 = 0;
      let d30 = 0;
      let cohortN = 0;
      for (const p of profilesInRange ?? []) {
        const signupDay = dayKey(new Date(p.created_at));
        const daysActive = activeByUserDays[p.id];
        if (!daysActive) continue;
        cohortN += 1;
        const d1Key = dayKey(new Date(new Date(p.created_at).getTime() + 86400000));
        const d7Key = dayKey(new Date(new Date(p.created_at).getTime() + 7 * 86400000));
        const d30Key = dayKey(new Date(new Date(p.created_at).getTime() + 30 * 86400000));
        if (daysActive.has(d1Key) || [...daysActive].some((d) => d > signupDay && d <= d1Key))
          d1 += 1;
        if ([...daysActive].some((d) => d > signupDay && d <= d7Key)) d7 += 1;
        if ([...daysActive].some((d) => d > signupDay && d <= d30Key)) d30 += 1;
        void cohortStart;
      }
      const retention = {
        d1: cohortN ? Math.round((d1 / cohortN) * 1000) / 10 : 0,
        d7: cohortN ? Math.round((d7 / cohortN) * 1000) / 10 : 0,
        d30: cohortN ? Math.round((d30 / Math.max(1, cohortN)) * 1000) / 10 : 0,
        cohortSize: cohortN || cohortUsers.size,
      };

      // Pipeline
      const collectorList = collectors ?? [];
      const newestTrendAgeHours = (() => {
        const finished = collectorList.find((c) => c.finished_at || c.created_at);
        if (!finished) return null;
        const t = new Date(finished.finished_at || finished.created_at).getTime();
        return Math.round(((Date.now() - t) / 3600000) * 10) / 10;
      })();
      const bySource: Record<string, { count: number; lastRun: string | null; errors: number }> =
        {};
      for (const c of collectorList) {
        const src = c.source || 'unknown';
        if (!bySource[src]) bySource[src] = { count: 0, lastRun: null, errors: 0 };
        bySource[src].count += c.trend_count || 0;
        if (!bySource[src].lastRun) bySource[src].lastRun = c.finished_at || c.created_at;
        if (c.error) bySource[src].errors += 1;
      }
      const pipeline = {
        collectors: Object.entries(bySource).map(([source, v]) => ({
          source,
          trends: v.count,
          lastRun: v.lastRun,
          errors: v.errors,
          healthy: v.errors === 0,
        })),
        freshnessHours: newestTrendAgeHours,
        recent: collectorList.slice(0, 10),
      };

      // Revenue
      const orders = billingOrders ?? [];
      const paidOrders = orders.filter(
        (o) => String(o.status || '').toLowerCase() === 'paid' || String(o.status).toLowerCase() === 'captured'
      );
      const revenue = {
        mrr: estMrr,
        arpu,
        checkoutStarted: orders.length,
        paid: paidOrders.length,
        conversionPct: orders.length
          ? Math.round((paidOrders.length / orders.length) * 1000) / 10
          : 0,
        mrrTrend: (dailyRows ?? []).map((d) => ({
          date: String(d.day).slice(5),
          mrr: d.est_mrr,
        })),
      };

      // Users snapshot (no passwords)
      const summaryByUser = new Map(
        (activitySummaries ?? []).map((s) => [s.user_id, s])
      );
      const usersSnapshot = profiles.slice(0, 50).map((p) => {
        const sum = summaryByUser.get(p.id);
        return {
          id: p.id,
          email: p.email,
          name: p.full_name,
          plan: p.plan,
          lastLogin: p.last_login_at || sum?.last_login_at || null,
          activeMs7d: Number(sum?.active_ms_7d ?? 0),
          activeMs30d: Number(sum?.active_ms_30d ?? 0),
          scripts30d: Number(sum?.script_gens_30d ?? 0),
        };
      });

      const platformVolume: Record<string, number> = {};
      for (const c of connections ?? []) {
        const p = (c.platform || 'unknown').toLowerCase();
        platformVolume[p] = (platformVolume[p] || 0) + 1;
      }

      return NextResponse.json({
        range: rangeParam,
        generatedAt,
        source: 'supabase',
        overview: {
          kpis: {
            dau: dauUsers.size,
            wau: wauUsers.size,
            signups: (profilesInRange ?? []).length,
            estMrr,
            arpu,
            aiSuccessPct: aiSection.successPct,
            scriptGens: gens.length,
            avgSessionMin: Math.round((avgSessionMs / 60000) * 10) / 10,
            freshnessHours: newestTrendAgeHours,
            totalUsers: total,
            payingUsers: paying,
            freeToPaidPct: freeToPaid,
            onboardingRate,
            activeEventUsers: new Set((events ?? []).map((e) => e.user_id).filter(Boolean)).size,
            newSignupsInRange: (profilesInRange ?? []).length,
          },
          gauges: {
            aiSuccessPct: aiSection.successPct,
            onboardingPct: onboardingRate,
            freeToPaidPct: freeToPaid,
          },
        },
        // backwards-compat for older UI
        kpis: {
          estMrr,
          arpu,
          freeToPaidPct: freeToPaid,
          onboardingRate,
          totalUsers: total,
          payingUsers: paying,
          activeEventUsers: new Set((events ?? []).map((e) => e.user_id).filter(Boolean)).size,
          newSignupsInRange: (profilesInRange ?? []).length,
        },
        growth,
        funnel,
        planMix,
        platformVolume: Object.entries(platformVolume).map(([name, count]) => ({ name, count })),
        engagement: {
          totalActiveMs,
          avgSessionMin: Math.round((avgSessionMs / 60000) * 10) / 10,
          sessionsPerUser:
            sessionUsers.size > 0
              ? Math.round((sess.length / sessionUsers.size) * 10) / 10
              : 0,
          pagesPerSession,
          retention,
        },
        scripts,
        keywords,
        carousel,
        ai: aiSection,
        pipeline,
        revenue,
        users: usersSnapshot,
        daily: dailyRows ?? [],
      });
    }
  }

  return NextResponse.json({
    range: rangeParam,
    generatedAt,
    source: 'mock',
    overview: {
      kpis: {
        dau: 8,
        wau: 14,
        signups: 5,
        estMrr: 6997,
        arpu: 350,
        aiSuccessPct: 92,
        scriptGens: 12,
        avgSessionMin: 6.5,
        freshnessHours: 2.1,
        totalUsers: 20,
        payingUsers: 3,
        freeToPaidPct: 12.5,
        onboardingRate: 64,
      },
      gauges: { aiSuccessPct: 92, onboardingPct: 64, freeToPaidPct: 12.5 },
    },
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
      paying: Math.round(Math.random() * 1),
    })),
    funnel: [
      { step: 'Signup', count: 20 },
      { step: 'Onboard complete', count: 14 },
      { step: 'First trend view', count: 10 },
      { step: 'First AI', count: 6 },
      { step: 'First script', count: 4 },
      { step: 'Checkout', count: 3 },
      { step: 'Paid', count: 3 },
    ],
    planMix: [
      { name: 'Free', value: 17, mrr: 0 },
      { name: 'Pro', value: 2, mrr: 1998 },
      { name: 'Agency', value: 1, mrr: 4999 },
    ],
    platformVolume: [
      { name: 'youtube', count: 4 },
      { name: 'instagram', count: 3 },
    ],
    engagement: {
      totalActiveMs: 3600000,
      avgSessionMin: 6.5,
      sessionsPerUser: 2.1,
      pagesPerSession: 4.2,
      retention: { d1: 40, d7: 22, d30: 10, cohortSize: 5 },
    },
    scripts: {
      series: [],
      mix: { audience: [], duration: [], language: [] },
      topTopics: [],
      rates: { total: 0, successPct: 0, savePct: 0, copyPct: 0, failPct: 0 },
    },
    keywords: { top: [], zeroResult: [], series: [], total: 0 },
    carousel: { kpis: { creates: 0, exports: 0, exportRate: 0 }, mix: [], recent: [] },
    ai: {
      byTask: [],
      byModel: [],
      latency: { p50: null, p95: null, avg: null },
      series: [],
      errors: [],
      cost: 0,
      successPct: 0,
      total: 0,
      fallbackShare: 0,
    },
    pipeline: { collectors: [], freshnessHours: null, recent: [] },
    revenue: { mrr: 6997, arpu: 350, checkoutStarted: 0, paid: 0, conversionPct: 0, mrrTrend: [] },
    users: [],
    daily: [],
  });
}
