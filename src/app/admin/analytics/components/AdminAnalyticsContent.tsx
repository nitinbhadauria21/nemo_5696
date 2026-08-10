'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';

const ORANGE = '#FF5A1F';
const TEAL = '#2DD4BF';
const AMBER = '#F59E0B';
const MUTE = '#8a8076';
const PIE_COLORS = [ORANGE, TEAL, AMBER, '#818CF8', '#F472B6', '#34D399'];

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'growth', label: 'Growth' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'ai', label: 'AI Ops' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'users', label: 'Users' },
] as const;

type MetricsPayload = {
  range: string;
  generatedAt?: string;
  source: string;
  overview?: {
    kpis: Record<string, number | null | undefined>;
    gauges: { aiSuccessPct: number; onboardingPct: number; freeToPaidPct: number };
  };
  growth: { date: string; signups: number; paying?: number }[];
  funnel: { step: string; count: number }[];
  planMix: { name: string; value: number; mrr?: number }[];
  engagement?: {
    avgSessionMin: number;
    sessionsPerUser: number;
    pagesPerSession: number;
    retention: { d1: number; d7: number; d30: number; cohortSize: number };
  };
  scripts?: {
    series: { date: string; count: number }[];
    mix: {
      audience: { name: string; value: number }[];
      duration: { name: string; value: number }[];
      language: { name: string; value: number }[];
    };
    topTopics: { name: string; value: number }[];
    rates: {
      total: number;
      successPct: number;
      savePct: number;
      copyPct: number;
      failPct: number;
    };
  };
  keywords?: {
    top: { query: string; count: number; avgResults: number | null }[];
    zeroResult: { query: string; count: number }[];
    series: { date: string; count: number }[];
    total: number;
  };
  carousel?: {
    kpis: { creates: number; exports: number; exportRate: number };
    mix: { name: string; value: number }[];
    recent: { id: string; topic: string | null; exported: boolean; createdAt: string }[];
  };
  ai?: {
    byTask: { name: string; value: number }[];
    byModel: { name: string; value: number }[];
    latency: { p50: number | null; p95: number | null; avg: number | null };
    series: { date: string; calls: number; errors: number }[];
    errors: {
      task: string | null;
      model: string | null;
      error: string | null;
      createdAt: string;
    }[];
    cost: number;
    successPct: number;
    total: number;
  };
  pipeline?: {
    collectors: {
      source: string;
      trends: number;
      lastRun: string | null;
      errors: number;
      healthy: boolean;
    }[];
    freshnessHours: number | null;
  };
  revenue?: {
    mrr: number;
    arpu: number;
    checkoutStarted: number;
    paid: number;
    conversionPct: number;
    mrrTrend: { date: string; mrr: number }[];
  };
  users?: {
    id: string;
    email?: string | null;
    name?: string | null;
    plan?: string | null;
    lastLogin?: string | null;
    activeMs7d?: number;
    scripts30d?: number;
  }[];
};

const tipStyle = {
  background: '#1c1916',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  fontSize: 12,
};

function Empty({ label = 'No data in range' }: { label?: string }) {
  return <p className="py-8 text-center text-sm text-[var(--admin-mute)]">{label}</p>;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-kpi">
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value text-[1.35rem]">{value}</div>
    </div>
  );
}

function formatMs(ms?: number) {
  if (!ms) return '—';
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function AdminAnalyticsContent() {
  const [range, setRange] = useState('30d');
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<string>('overview');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/metrics?range=${range}`)
      .then((r) => r.json())
      .then((d) => setMetrics(d))
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTIONS.some((s) => s.id === hash)) setSection(hash);
  }, []);

  const gauges = useMemo(() => {
    const g = metrics?.overview?.gauges;
    if (!g) return [];
    return [
      { name: 'AI success', value: g.aiSuccessPct, fill: ORANGE },
      { name: 'Onboarding', value: g.onboardingPct, fill: TEAL },
      { name: 'Free→Paid', value: g.freeToPaidPct, fill: AMBER },
    ];
  }, [metrics]);

  const k = metrics?.overview?.kpis;

  const scrollTo = (id: string) => {
    setSection(id);
    const el = document.getElementById(`sec-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--admin-line)] bg-[var(--admin-surface)]/95 px-3 py-2 backdrop-blur">
        <h1 className="mr-2 font-display text-sm font-bold">Analytics</h1>
        {(['7d', '30d', '90d'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`admin-btn ${range === r ? 'admin-btn-primary' : ''}`}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[var(--admin-mute)]">
          {loading
            ? 'Loading…'
            : `Refreshed ${metrics?.generatedAt ? new Date(metrics.generatedAt).toLocaleTimeString() : '—'}`}
          {' · '}
          Source: {metrics?.source === 'supabase' ? 'live Supabase' : (metrics?.source ?? '…')}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              section === s.id
                ? 'bg-[rgba(255,90,31,0.18)] text-[#FF6B2B]'
                : 'text-[var(--admin-mute)] hover:bg-[var(--admin-surface-2)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      <section id="sec-overview" className="space-y-4 scroll-mt-16">
        <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Overview</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="DAU" value={k ? String(k.dau ?? '—') : '—'} />
          <Kpi label="WAU" value={k ? String(k.wau ?? '—') : '—'} />
          <Kpi label="Signups" value={k ? String(k.signups ?? '—') : '—'} />
          <Kpi
            label="Est. MRR"
            value={k?.estMrr != null ? `₹${Number(k.estMrr).toLocaleString('en-IN')}` : '—'}
          />
          <Kpi label="AI success" value={k?.aiSuccessPct != null ? `${k.aiSuccessPct}%` : '—'} />
          <Kpi label="Script gens" value={k ? String(k.scriptGens ?? '—') : '—'} />
          <Kpi label="Avg session" value={k?.avgSessionMin != null ? `${k.avgSessionMin}m` : '—'} />
          <Kpi label="Data age" value={k?.freshnessHours != null ? `${k.freshnessHours}h` : '—'} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Health gauges</h3>
            <div className="h-48">
              {gauges.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    data={gauges}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" cornerRadius={6} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: MUTE }} />
                    <Tooltip contentStyle={tipStyle} />
                  </RadialBarChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Plan mix</h3>
            <div className="h-48">
              {(metrics?.planMix ?? []).some((p) => p.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.planMix ?? []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {(metrics?.planMix ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, color: MUTE }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Growth + Funnel */}
      <section id="sec-growth" className="grid scroll-mt-16 gap-4 lg:grid-cols-2">
        <div className="admin-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold">Growth · signups</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.growth ?? []}>
                <defs>
                  <linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: MUTE, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: MUTE, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip contentStyle={tipStyle} />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke={ORANGE}
                  fill="url(#gFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold">Activation funnel</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.funnel ?? []} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: MUTE, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="step"
                  width={110}
                  tick={{ fill: '#c9bfb4', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="count" fill={ORANGE} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Engagement */}
      <section id="sec-engagement" className="scroll-mt-16 space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Engagement</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Avg session" value={`${metrics?.engagement?.avgSessionMin ?? '—'}m`} />
          <Kpi label="Sessions/user" value={String(metrics?.engagement?.sessionsPerUser ?? '—')} />
          <Kpi label="Pages/session" value={String(metrics?.engagement?.pagesPerSession ?? '—')} />
          <Kpi label="Retention D1" value={`${metrics?.engagement?.retention.d1 ?? '—'}%`} />
          <Kpi label="Retention D7" value={`${metrics?.engagement?.retention.d7 ?? '—'}%`} />
        </div>
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cohort size</th>
                <th>D1</th>
                <th>D7</th>
                <th>D30</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{metrics?.engagement?.retention.cohortSize ?? '—'}</td>
                <td>{metrics?.engagement?.retention.d1 ?? '—'}%</td>
                <td>{metrics?.engagement?.retention.d7 ?? '—'}%</td>
                <td>{metrics?.engagement?.retention.d30 ?? '—'}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Scripts */}
      <section id="sec-scripts" className="scroll-mt-16 space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">
          Viral Script Writer
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Gens" value={String(metrics?.scripts?.rates.total ?? 0)} />
          <Kpi label="Success" value={`${metrics?.scripts?.rates.successPct ?? 0}%`} />
          <Kpi label="Save rate" value={`${metrics?.scripts?.rates.savePct ?? 0}%`} />
          <Kpi label="Copy rate" value={`${metrics?.scripts?.rates.copyPct ?? 0}%`} />
          <Kpi label="Fail rate" value={`${metrics?.scripts?.rates.failPct ?? 0}%`} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Volume</h3>
            <div className="h-48">
              {(metrics?.scripts?.series ?? []).length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.scripts?.series ?? []}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: MUTE, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: MUTE, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip contentStyle={tipStyle} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={ORANGE}
                      fill={ORANGE}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Audience mix</h3>
            <div className="h-48">
              {(metrics?.scripts?.mix.audience ?? []).length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.scripts?.mix.audience ?? []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                    >
                      {(metrics?.scripts?.mix.audience ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
        </div>
        <div className="admin-card overflow-hidden">
          <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
            Top topics
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.scripts?.topTopics ?? []).map((t) => (
                <tr key={t.name}>
                  <td className="max-w-xs truncate">{t.name}</td>
                  <td className="font-mono text-xs">{t.value}</td>
                </tr>
              ))}
              {(metrics?.scripts?.topTopics ?? []).length === 0 && (
                <tr>
                  <td colSpan={2} className="text-[var(--admin-mute)]">
                    No data in range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Keywords */}
      <section id="sec-keywords" className="scroll-mt-16 space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Keywords</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Volume over time</h3>
            <div className="h-48">
              {(metrics?.keywords?.series ?? []).some((s) => s.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.keywords?.series ?? []}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: MUTE, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: MUTE, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip contentStyle={tipStyle} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={TEAL}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Top 10 queries</h3>
            <div className="h-48">
              {(metrics?.keywords?.top ?? []).length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(metrics?.keywords?.top ?? []).slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: MUTE, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="query"
                      width={100}
                      tick={{ fill: '#c9bfb4', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tipStyle} />
                    <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
        </div>
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Count</th>
                <th>Avg results</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.keywords?.top ?? []).map((row) => (
                <tr key={row.query}>
                  <td>{row.query}</td>
                  <td className="font-mono text-xs">{row.count}</td>
                  <td className="font-mono text-xs">{row.avgResults ?? '—'}</td>
                </tr>
              ))}
              {(metrics?.keywords?.top ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="text-[var(--admin-mute)]">
                    No data in range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Carousel */}
      <section id="sec-carousel" className="scroll-mt-16 space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Carousel</h2>
        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Creates" value={String(metrics?.carousel?.kpis.creates ?? 0)} />
          <Kpi label="Exports" value={String(metrics?.carousel?.kpis.exports ?? 0)} />
          <Kpi label="Export rate" value={`${metrics?.carousel?.kpis.exportRate ?? 0}%`} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Export mix</h3>
            <div className="h-40">
              {(metrics?.carousel?.mix ?? []).some((m) => m.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.carousel?.mix ?? []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={36}
                      outerRadius={60}
                    >
                      {(metrics?.carousel?.mix ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, color: MUTE }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
          <div className="admin-card overflow-hidden">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Exported</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.carousel?.recent ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className="max-w-[160px] truncate">{c.topic || '—'}</td>
                    <td>{c.exported ? 'Yes' : 'No'}</td>
                    <td className="font-mono text-[10px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(metrics?.carousel?.recent ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-[var(--admin-mute)]">
                      No data in range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AI Ops */}
      <section id="sec-ai" className="scroll-mt-16 space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">AI Ops</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Calls" value={String(metrics?.ai?.total ?? 0)} />
          <Kpi label="Success" value={`${metrics?.ai?.successPct ?? 0}%`} />
          <Kpi
            label="p50 latency"
            value={metrics?.ai?.latency.p50 != null ? `${metrics.ai.latency.p50}ms` : '—'}
          />
          <Kpi
            label="p95 latency"
            value={metrics?.ai?.latency.p95 != null ? `${metrics.ai.latency.p95}ms` : '—'}
          />
          <Kpi label="Est. cost" value={`$${metrics?.ai?.cost ?? 0}`} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Volume</h3>
            <div className="h-48">
              {(metrics?.ai?.series ?? []).some((s) => s.calls > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.ai?.series ?? []}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: MUTE, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: MUTE, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip contentStyle={tipStyle} />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stackId="1"
                      stroke={ORANGE}
                      fill={ORANGE}
                      fillOpacity={0.35}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stackId="1"
                      stroke="#f04438"
                      fill="#f04438"
                      fillOpacity={0.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
          <div className="admin-card p-4">
            <h3 className="mb-2 font-display text-sm font-bold">Model mix</h3>
            <div className="h-48">
              {(metrics?.ai?.byModel ?? []).length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.ai?.byModel ?? []}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                    >
                      {(metrics?.ai?.byModel ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
          </div>
        </div>
        <div className="admin-card overflow-hidden">
          <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
            Recent errors
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Model</th>
                <th>Error</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.ai?.errors ?? []).map((e, i) => (
                <tr key={`${e.createdAt}-${i}`}>
                  <td>{e.task || '—'}</td>
                  <td className="max-w-[140px] truncate font-mono text-[10px]">{e.model || '—'}</td>
                  <td>{e.error || '—'}</td>
                  <td className="font-mono text-[10px]">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(metrics?.ai?.errors ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="text-[var(--admin-mute)]">
                    No errors in range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pipeline */}
      <section id="sec-pipeline" className="scroll-mt-16 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Data pipeline</h2>
          <Link href="/admin/health" className="text-xs text-[#FF6B2B]">
            Open System →
          </Link>
        </div>
        <Kpi
          label="Freshness"
          value={
            metrics?.pipeline?.freshnessHours != null ? `${metrics.pipeline.freshnessHours}h` : '—'
          }
        />
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Trends</th>
                <th>Last run</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.pipeline?.collectors ?? []).map((c) => (
                <tr key={c.source}>
                  <td>{c.source}</td>
                  <td className="font-mono text-xs">{c.trends}</td>
                  <td className="font-mono text-[10px]">
                    {c.lastRun ? new Date(c.lastRun).toLocaleString() : '—'}
                  </td>
                  <td>
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        c.healthy ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                  </td>
                </tr>
              ))}
              {(metrics?.pipeline?.collectors ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="text-[var(--admin-mute)]">
                    No collector runs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Revenue */}
      <section id="sec-revenue" className="scroll-mt-16 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Revenue</h2>
          <Link href="/admin/revenue" className="text-xs text-[#FF6B2B]">
            Open Revenue →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            label="Est. MRR"
            value={
              metrics?.revenue?.mrr != null
                ? `₹${metrics.revenue.mrr.toLocaleString('en-IN')}`
                : '—'
            }
          />
          <Kpi
            label="ARPU"
            value={metrics?.revenue?.arpu != null ? `₹${metrics.revenue.arpu}` : '—'}
          />
          <Kpi label="Checkouts" value={String(metrics?.revenue?.checkoutStarted ?? 0)} />
          <Kpi label="Paid conversion" value={`${metrics?.revenue?.conversionPct ?? 0}%`} />
        </div>
      </section>

      {/* Users snapshot */}
      <section id="sec-users" className="scroll-mt-16 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">
            Users snapshot
          </h2>
          <Link href="/admin/users" className="text-xs text-[#FF6B2B]">
            Manage users →
          </Link>
        </div>
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email / Name</th>
                  <th>Plan</th>
                  <th>Last login</th>
                  <th>Time 7d</th>
                  <th>Scripts 30d</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.users ?? []).map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="hover:text-[#FF6B2B]">
                        <div className="font-medium">{u.name || '—'}</div>
                        <div className="text-xs text-[var(--admin-mute)]">{u.email}</div>
                      </Link>
                    </td>
                    <td>
                      <span className="admin-pill admin-pill-free">{u.plan || 'free'}</span>
                    </td>
                    <td className="font-mono text-[10px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                    </td>
                    <td className="font-mono text-xs">{formatMs(u.activeMs7d)}</td>
                    <td className="font-mono text-xs">{u.scripts30d ?? 0}</td>
                  </tr>
                ))}
                {(metrics?.users ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-[var(--admin-mute)]">
                      No users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
