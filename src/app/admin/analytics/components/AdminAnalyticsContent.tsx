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
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';

const ORANGE = '#FF5A1F';
const TEAL = '#2DD4BF';
const AMBER = '#F59E0B';
const MUTE = '#8a8076';
const PIE_COLORS = [ORANGE, TEAL, AMBER, '#818CF8', '#F472B6', '#34D399'];

const PRIMARY_NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'trends', label: 'Trends' },
  { id: 'scripts', label: 'Viral Scripts' },
  { id: 'browser', label: 'Browser' },
] as const;

const OPS_NAV = [
  { id: 'ai', label: 'AI Ops' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'revenue', label: 'Revenue' },
] as const;

const ALL_SECTIONS = [...PRIMARY_NAV, ...OPS_NAV];

type KeywordFeedItem = {
  id: string;
  query: string;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  source?: string | null;
  resultCount?: number | null;
  createdAt: string;
};

type ScriptGenRow = {
  id: string;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  mode?: string | null;
  topic?: string | null;
  refineTopic?: string | null;
  refineDraftPreview?: string | null;
  duration?: string | null;
  durationSeconds?: number | null;
  scenesCount?: number | null;
  language?: string | null;
  audienceType?: string | null;
  frameworkLabel?: string | null;
  viralScore?: number | null;
  success?: boolean;
  parseOk?: boolean;
  copied?: boolean;
  saved?: boolean;
  savedScriptId?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  createdAt: string;
};

type UserRow = {
  id: string;
  email?: string | null;
  name?: string | null;
  plan?: string | null;
  status?: string | null;
  onboarded?: boolean;
  niches?: string[];
  platforms?: string[];
  connections?: string[];
  connectionDetails?: { platform: string; connectedAt: string }[];
  lastLogin?: string | null;
  lastActive?: string | null;
  activeMs7d?: number;
  activeMs30d?: number;
  scripts30d?: number;
  scriptsSaved30d?: number;
  keywordCount?: number;
  recentKeywords?: string[];
  createdAt?: string | null;
};

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
      mode?: { name: string; value: number }[];
    };
    topTopics: { name: string; value: number }[];
    rates: {
      total: number;
      successPct: number;
      savePct: number;
      copyPct: number;
      failPct: number;
      createPct?: number;
      refinePct?: number;
      avgDurationSec?: number | null;
    };
    generations?: ScriptGenRow[];
    feed?: ScriptGenRow[];
  };
  keywords?: {
    feed?: KeywordFeedItem[];
    top: { query: string; count: number; avgResults: number | null }[];
    zeroResult: { query: string; count: number }[];
    series: { date: string; count: number }[];
    total: number;
  };
  trends?: {
    kpis: {
      interactions: number;
      opens: number;
      bookmarks: number;
      filters: number;
      aiTrendCalls: number;
    };
    feed: {
      id: string;
      email?: string | null;
      name?: string | null;
      action: string;
      category?: string | null;
      trendId?: string | null;
      title?: string | null;
      createdAt: string;
    }[];
    topTrendIds: { name: string; value: number }[];
  };
  browser?: {
    pageViews: {
      id: string;
      path: string;
      email?: string | null;
      name?: string | null;
      createdAt: string;
    }[];
    topPaths: { name: string; value: number }[];
    sessionsSummary: {
      sessions: number;
      uniqueUsers: number;
      avgSessionMin: number;
      pagesPerSession: number;
      totalActiveMs: number;
    };
    recentSessions: {
      id: string;
      email?: string | null;
      name?: string | null;
      activeMs: number;
      pageCount: number;
      entryPath?: string | null;
      exitPath?: string | null;
      device?: string | null;
      browser?: string | null;
      startedAt: string;
      lastSeenAt: string;
    }[];
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
  users?: UserRow[];
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

function planPill(plan?: string | null) {
  const p = (plan || 'free').toLowerCase();
  const cls =
    p === 'agency' ? 'admin-pill-agency' : p === 'pro' ? 'admin-pill-pro' : 'admin-pill-free';
  return <span className={`admin-pill ${cls}`}>{p}</span>;
}

export default function AdminAnalyticsContent() {
  const [range, setRange] = useState('30d');
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<string>('overview');
  const [opsOpen, setOpsOpen] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

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
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ALL_SECTIONS.some((s) => s.id === hash)) {
        setSection(hash);
        if (OPS_NAV.some((s) => s.id === hash)) setOpsOpen(true);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
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

  const go = (id: string) => {
    setSection(id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const keywordFeed = useMemo(() => {
    const feed = metrics?.keywords?.feed ?? [];
    const q = keywordFilter.trim().toLowerCase();
    if (!q) return feed;
    return feed.filter(
      (row) =>
        (row.query || '').toLowerCase().includes(q) ||
        (row.email || '').toLowerCase().includes(q) ||
        (row.name || '').toLowerCase().includes(q) ||
        (row.source || '').toLowerCase().includes(q)
    );
  }, [metrics, keywordFilter]);

  const selectedKeyword = useMemo(
    () => keywordFeed.find((r) => r.id === selectedKeywordId) || keywordFeed[0] || null,
    [keywordFeed, selectedKeywordId]
  );

  const sameKeywordRows = useMemo(() => {
    if (!selectedKeyword?.query) return [];
    const q = selectedKeyword.query.toLowerCase();
    return (metrics?.keywords?.feed ?? []).filter((r) => (r.query || '').toLowerCase() === q);
  }, [metrics, selectedKeyword]);

  const users = useMemo(() => {
    const list = metrics?.users ?? [];
    const q = userFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [metrics, userFilter]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || users[0] || null,
    [users, selectedUserId]
  );

  const scriptRows = metrics?.scripts?.generations ?? metrics?.scripts?.feed ?? [];

  const resetPassword = async (userId: string) => {
    if (
      !confirm('Generate a temporary password? It will be shown once only and is never stored.')
    ) {
      return;
    }
    setResetBusy(true);
    setTempPassword(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setTempPassword(d.temporaryPassword);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetBusy(false);
    }
  };

  const navBtn = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => go(id)}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
        section === id
          ? 'bg-[rgba(255,90,31,0.18)] text-[#FF6B2B]'
          : 'text-[var(--admin-mute)] hover:bg-[var(--admin-surface-2)] hover:text-[var(--admin-text)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
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

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Left nav */}
        <aside className="admin-card h-fit space-y-1 p-2 lg:sticky lg:top-14">
          {PRIMARY_NAV.map((s) => navBtn(s.id, s.label))}
          <div className="my-2 border-t border-[var(--admin-line)]" />
          <button
            type="button"
            onClick={() => setOpsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-[var(--admin-mute)]"
          >
            Ops
            <span>{opsOpen ? '▾' : '▸'}</span>
          </button>
          {opsOpen && OPS_NAV.map((s) => navBtn(s.id, s.label))}
        </aside>

        <main className="min-w-0 space-y-4">
          {/* Overview */}
          {section === 'overview' && (
            <div className="space-y-4">
              <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Overview</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="DAU" value={k ? String(k.dau ?? '—') : '—'} />
                <Kpi label="WAU" value={k ? String(k.wau ?? '—') : '—'} />
                <Kpi label="Signups" value={k ? String(k.signups ?? '—') : '—'} />
                <Kpi
                  label="Est. MRR"
                  value={k?.estMrr != null ? `₹${Number(k.estMrr).toLocaleString('en-IN')}` : '—'}
                />
                <Kpi
                  label="AI success"
                  value={k?.aiSuccessPct != null ? `${k.aiSuccessPct}%` : '—'}
                />
                <Kpi label="Script gens" value={k ? String(k.scriptGens ?? '—') : '—'} />
                <Kpi
                  label="Keywords"
                  value={k ? String(k.keywordSearches ?? metrics?.keywords?.total ?? '—') : '—'}
                />
                <Kpi label="Page views" value={k ? String(k.pageViews ?? '—') : '—'} />
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
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="admin-card p-4">
                  <h3 className="mb-3 font-display text-sm font-bold">Growth · signups</h3>
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
                  <h3 className="mb-3 font-display text-sm font-bold">Activation funnel</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={metrics?.funnel ?? []}
                        layout="vertical"
                        margin={{ left: 24 }}
                      >
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
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Kpi label="Avg session" value={`${metrics?.engagement?.avgSessionMin ?? '—'}m`} />
                <Kpi
                  label="Sessions/user"
                  value={String(metrics?.engagement?.sessionsPerUser ?? '—')}
                />
                <Kpi
                  label="Pages/session"
                  value={String(metrics?.engagement?.pagesPerSession ?? '—')}
                />
                <Kpi label="Retention D1" value={`${metrics?.engagement?.retention.d1 ?? '—'}%`} />
                <Kpi label="Retention D7" value={`${metrics?.engagement?.retention.d7 ?? '—'}%`} />
              </div>
            </div>
          )}

          {/* Users */}
          {section === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Users</h2>
                <Link href="/admin/users" className="text-xs text-[#FF6B2B]">
                  Manage users →
                </Link>
              </div>
              <p className="text-xs text-[var(--admin-mute)]">
                Passwords are never stored or shown. Use Reset password to issue a one-time
                temporary password.
              </p>
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="admin-card flex max-h-[70vh] flex-col overflow-hidden">
                  <div className="border-b border-[var(--admin-line)] p-2">
                    <input
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      placeholder="Filter users…"
                      className="admin-input w-full text-sm"
                    />
                  </div>
                  <div className="overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setTempPassword(null);
                        }}
                        className={`block w-full border-b border-[var(--admin-line)] px-3 py-2.5 text-left ${
                          selectedUser?.id === u.id
                            ? 'bg-[rgba(255,90,31,0.12)]'
                            : 'hover:bg-[var(--admin-surface-2)]'
                        }`}
                      >
                        <div className="truncate text-sm font-medium">{u.name || '—'}</div>
                        <div className="truncate text-xs text-[var(--admin-mute)]">{u.email}</div>
                      </button>
                    ))}
                    {users.length === 0 && <Empty label="No users" />}
                  </div>
                </div>
                <div className="admin-card space-y-4 p-4">
                  {selectedUser ? (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-display text-lg font-bold">
                            {selectedUser.name || '—'}
                          </div>
                          <div className="text-sm text-[var(--admin-mute)]">
                            {selectedUser.email}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {planPill(selectedUser.plan)}
                            <span className="admin-pill admin-pill-free">
                              {selectedUser.status || 'active'}
                            </span>
                            <span className="admin-pill admin-pill-free">
                              {selectedUser.onboarded ? 'onboarded' : 'not onboarded'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/users/${selectedUser.id}`}
                            className="admin-btn text-xs"
                          >
                            Open profile
                          </Link>
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary text-xs"
                            disabled={resetBusy}
                            onClick={() => resetPassword(selectedUser.id)}
                          >
                            {resetBusy ? 'Resetting…' : 'Reset password'}
                          </button>
                        </div>
                      </div>
                      {tempPassword && (
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                          <div className="font-bold text-amber-200">Temporary password (once)</div>
                          <code className="mt-1 block font-mono text-base">{tempPassword}</code>
                          <p className="mt-1 text-xs text-[var(--admin-mute)]">
                            Copy now — not stored in the database and will not be shown again.
                          </p>
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Last login
                          </div>
                          <div className="font-mono text-xs">
                            {selectedUser.lastLogin
                              ? new Date(selectedUser.lastLogin).toLocaleString()
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Last active
                          </div>
                          <div className="font-mono text-xs">
                            {selectedUser.lastActive
                              ? new Date(selectedUser.lastActive).toLocaleString()
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Time spent 7d
                          </div>
                          <div className="font-mono text-xs">
                            {formatMs(selectedUser.activeMs7d)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Time spent 30d
                          </div>
                          <div className="font-mono text-xs">
                            {formatMs(selectedUser.activeMs30d)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Scripts 30d
                          </div>
                          <div className="font-mono text-xs">
                            {selectedUser.scripts30d ?? 0} gen · {selectedUser.scriptsSaved30d ?? 0}{' '}
                            saved
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Keywords in range
                          </div>
                          <div className="font-mono text-xs">{selectedUser.keywordCount ?? 0}</div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] uppercase text-[var(--admin-mute)]">
                          Connected socials
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedUser.connections ?? []).length ? (
                            (selectedUser.connections ?? []).map((c) => (
                              <span key={c} className="admin-pill admin-pill-free">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--admin-mute)]">None</span>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 text-[10px] uppercase text-[var(--admin-mute)]">
                            Niches
                          </div>
                          <div className="text-xs">
                            {(selectedUser.niches ?? []).join(', ') || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] uppercase text-[var(--admin-mute)]">
                            Platform prefs
                          </div>
                          <div className="text-xs">
                            {(selectedUser.platforms ?? []).join(', ') || '—'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] uppercase text-[var(--admin-mute)]">
                          Recent keywords
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedUser.recentKeywords ?? []).length ? (
                            (selectedUser.recentKeywords ?? []).map((kw) => (
                              <span key={kw} className="admin-pill admin-pill-free">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--admin-mute)]">None in range</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Empty label="Select a user" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Keywords — feed first */}
          {section === 'keywords' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">
                  Keywords
                </h2>
                <span className="text-xs text-[var(--admin-mute)]">
                  {metrics?.keywords?.total ?? 0} typed in range
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.1fr)]">
                <div className="admin-card flex max-h-[72vh] flex-col overflow-hidden">
                  <div className="border-b border-[var(--admin-line)] p-2">
                    <input
                      value={keywordFilter}
                      onChange={(e) => setKeywordFilter(e.target.value)}
                      placeholder="Filter typed queries…"
                      className="admin-input w-full text-sm"
                    />
                  </div>
                  <div className="overflow-y-auto">
                    {keywordFeed.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedKeywordId(row.id)}
                        className={`block w-full border-b border-[var(--admin-line)] px-3 py-2.5 text-left ${
                          selectedKeyword?.id === row.id
                            ? 'bg-[rgba(45,212,191,0.12)]'
                            : 'hover:bg-[var(--admin-surface-2)]'
                        }`}
                      >
                        <div className="truncate text-sm font-medium">{row.query || '—'}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-[var(--admin-mute)]">
                          <span>{row.name || row.email || 'anon'}</span>
                          <span>{row.source || '—'}</span>
                          <span>{new Date(row.createdAt).toLocaleString()}</span>
                        </div>
                      </button>
                    ))}
                    {keywordFeed.length === 0 && <Empty label="No typed queries in range" />}
                  </div>
                </div>
                <div className="admin-card space-y-3 p-4">
                  {selectedKeyword ? (
                    <>
                      <div>
                        <div className="text-[10px] uppercase text-[var(--admin-mute)]">Query</div>
                        <div className="font-display text-base font-bold">
                          {selectedKeyword.query}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">User</div>
                          <div>{selectedKeyword.name || '—'}</div>
                          <div className="text-xs text-[var(--admin-mute)]">
                            {selectedKeyword.email}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Source
                          </div>
                          <div>{selectedKeyword.source || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">
                            Results
                          </div>
                          <div className="font-mono text-xs">
                            {selectedKeyword.resultCount ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-[var(--admin-mute)]">When</div>
                          <div className="font-mono text-xs">
                            {new Date(selectedKeyword.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[10px] uppercase text-[var(--admin-mute)]">
                          Who typed this ({sameKeywordRows.length})
                        </div>
                        <div className="admin-card overflow-hidden">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>User</th>
                                <th>Source</th>
                                <th>When</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sameKeywordRows.slice(0, 20).map((r) => (
                                <tr key={r.id}>
                                  <td className="max-w-[140px] truncate">
                                    {r.name || r.email || '—'}
                                  </td>
                                  <td>{r.source || '—'}</td>
                                  <td className="font-mono text-[10px]">
                                    {new Date(r.createdAt).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {(metrics?.keywords?.top ?? []).length > 0 && (
                        <div className="text-xs text-[var(--admin-mute)]">
                          Top query badge:{' '}
                          <span className="text-[var(--admin-text)]">
                            {metrics?.keywords?.top?.[0]?.query} (
                            {metrics?.keywords?.top?.[0]?.count}×)
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <Empty label="Select a typed query" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trends */}
          {section === 'trends' && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Trends</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Kpi label="Interactions" value={String(metrics?.trends?.kpis.interactions ?? 0)} />
                <Kpi label="Opens / analyze" value={String(metrics?.trends?.kpis.opens ?? 0)} />
                <Kpi label="Bookmarks" value={String(metrics?.trends?.kpis.bookmarks ?? 0)} />
                <Kpi label="Filters" value={String(metrics?.trends?.kpis.filters ?? 0)} />
                <Kpi
                  label="AI trend calls"
                  value={String(metrics?.trends?.kpis.aiTrendCalls ?? 0)}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="admin-card overflow-hidden">
                  <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
                    Top trend IDs
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Trend ID</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metrics?.trends?.topTrendIds ?? []).map((t) => (
                        <tr key={t.name}>
                          <td className="max-w-xs truncate font-mono text-xs">{t.name}</td>
                          <td className="font-mono text-xs">{t.value}</td>
                        </tr>
                      ))}
                      {(metrics?.trends?.topTrendIds ?? []).length === 0 && (
                        <tr>
                          <td colSpan={2} className="text-[var(--admin-mute)]">
                            No trend IDs in events
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="admin-card overflow-hidden">
                  <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
                    Recent interactions
                  </div>
                  <div className="max-h-[420px] overflow-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Action</th>
                          <th>Trend</th>
                          <th>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(metrics?.trends?.feed ?? []).map((row) => (
                          <tr key={row.id}>
                            <td className="max-w-[120px] truncate">
                              {row.name || row.email || '—'}
                            </td>
                            <td className="font-mono text-[10px]">{row.action}</td>
                            <td className="max-w-[140px] truncate text-xs">
                              {row.title || row.trendId || '—'}
                            </td>
                            <td className="font-mono text-[10px]">
                              {new Date(row.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {(metrics?.trends?.feed ?? []).length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-[var(--admin-mute)]">
                              No trend interactions in range
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Viral Scripts */}
          {section === 'scripts' && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">
                Viral Scripts
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
                <Kpi label="Gens" value={String(metrics?.scripts?.rates.total ?? 0)} />
                <Kpi label="Create %" value={`${metrics?.scripts?.rates.createPct ?? 0}%`} />
                <Kpi label="Refine %" value={`${metrics?.scripts?.rates.refinePct ?? 0}%`} />
                <Kpi label="Success" value={`${metrics?.scripts?.rates.successPct ?? 0}%`} />
                <Kpi label="Save rate" value={`${metrics?.scripts?.rates.savePct ?? 0}%`} />
                <Kpi label="Copy rate" value={`${metrics?.scripts?.rates.copyPct ?? 0}%`} />
                <Kpi label="Fail rate" value={`${metrics?.scripts?.rates.failPct ?? 0}%`} />
                <Kpi
                  label="Avg duration"
                  value={
                    metrics?.scripts?.rates.avgDurationSec != null
                      ? `${metrics.scripts.rates.avgDurationSec}s`
                      : '—'
                  }
                />
              </div>
              <div className="admin-card overflow-hidden">
                <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
                  Generations ({scriptRows.length})
                </div>
                <div className="max-h-[560px] overflow-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Mode</th>
                        <th>Topic</th>
                        <th>Dur</th>
                        <th>Scenes</th>
                        <th>Lang</th>
                        <th>Audience</th>
                        <th>Framework</th>
                        <th>Score</th>
                        <th>Flags</th>
                        <th>Model</th>
                        <th>Latency</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scriptRows.map((g) => (
                        <tr key={g.id}>
                          <td className="max-w-[120px]">
                            {g.userId ? (
                              <Link
                                href={`/admin/users/${g.userId}`}
                                className="hover:text-[#FF6B2B]"
                              >
                                <div className="truncate text-xs font-medium">{g.name || '—'}</div>
                                <div className="truncate text-[10px] text-[var(--admin-mute)]">
                                  {g.email}
                                </div>
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span className="admin-pill admin-pill-free">{g.mode || 'create'}</span>
                          </td>
                          <td className="max-w-[180px]">
                            <div className="truncate text-xs">{g.topic || '—'}</div>
                            {g.mode === 'refine' && (g.refineTopic || g.refineDraftPreview) && (
                              <div className="truncate text-[10px] text-[var(--admin-mute)]">
                                {g.refineTopic || g.refineDraftPreview}
                              </div>
                            )}
                          </td>
                          <td className="font-mono text-xs">
                            {g.durationSeconds != null
                              ? `${g.durationSeconds}s`
                              : g.duration || '—'}
                          </td>
                          <td className="font-mono text-xs">{g.scenesCount ?? '—'}</td>
                          <td className="text-xs">{g.language || '—'}</td>
                          <td className="max-w-[90px] truncate text-xs">{g.audienceType || '—'}</td>
                          <td className="max-w-[100px] truncate text-xs">
                            {g.frameworkLabel || '—'}
                          </td>
                          <td className="font-mono text-xs">{g.viralScore ?? '—'}</td>
                          <td className="text-[10px]">
                            {[
                              g.success ? 'ok' : 'fail',
                              g.parseOk ? 'parse' : null,
                              g.copied ? 'copy' : null,
                              g.saved ? 'saved' : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                            {g.savedScriptId && (
                              <div className="truncate font-mono text-[9px] text-[var(--admin-mute)]">
                                {g.savedScriptId.slice(0, 8)}…
                              </div>
                            )}
                          </td>
                          <td className="max-w-[90px] truncate font-mono text-[10px]">
                            {g.model || '—'}
                          </td>
                          <td className="font-mono text-[10px]">
                            {g.latencyMs != null ? `${g.latencyMs}ms` : '—'}
                          </td>
                          <td className="font-mono text-[10px]">
                            {new Date(g.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {scriptRows.length === 0 && (
                        <tr>
                          <td colSpan={13} className="text-[var(--admin-mute)]">
                            No generations in range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="admin-card p-4">
                  <h3 className="mb-2 font-display text-sm font-bold">Volume</h3>
                  <div className="h-40">
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
                  <div className="h-40">
                    {(metrics?.scripts?.mix.audience ?? []).length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics?.scripts?.mix.audience ?? []}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={36}
                            outerRadius={60}
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
            </div>
          )}

          {/* Browser */}
          {section === 'browser' && (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">Browser</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Kpi
                  label="Sessions"
                  value={String(metrics?.browser?.sessionsSummary.sessions ?? 0)}
                />
                <Kpi
                  label="Unique users"
                  value={String(metrics?.browser?.sessionsSummary.uniqueUsers ?? 0)}
                />
                <Kpi
                  label="Avg session"
                  value={`${metrics?.browser?.sessionsSummary.avgSessionMin ?? 0}m`}
                />
                <Kpi
                  label="Pages/session"
                  value={String(metrics?.browser?.sessionsSummary.pagesPerSession ?? 0)}
                />
                <Kpi label="Page views" value={String(metrics?.browser?.pageViews.length ?? 0)} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="admin-card overflow-hidden">
                  <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
                    Top pages
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Path</th>
                        <th>Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metrics?.browser?.topPaths ?? []).map((p) => (
                        <tr key={p.name}>
                          <td className="max-w-xs truncate font-mono text-xs">{p.name}</td>
                          <td className="font-mono text-xs">{p.value}</td>
                        </tr>
                      ))}
                      {(metrics?.browser?.topPaths ?? []).length === 0 && (
                        <tr>
                          <td colSpan={2} className="text-[var(--admin-mute)]">
                            No page views
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="admin-card overflow-hidden">
                  <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
                    Recent page views
                  </div>
                  <div className="max-h-[360px] overflow-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Path</th>
                          <th>User</th>
                          <th>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(metrics?.browser?.pageViews ?? []).map((pv) => (
                          <tr key={pv.id}>
                            <td className="max-w-[160px] truncate font-mono text-xs">{pv.path}</td>
                            <td className="max-w-[120px] truncate text-xs">
                              {pv.name || pv.email || '—'}
                            </td>
                            <td className="font-mono text-[10px]">
                              {new Date(pv.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {(metrics?.browser?.pageViews ?? []).length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-[var(--admin-mute)]">
                              No page views in range
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="admin-card overflow-hidden">
                <div className="border-b border-[var(--admin-line)] px-4 py-2 font-display text-sm font-bold">
                  Recent sessions
                </div>
                <div className="max-h-[360px] overflow-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Active</th>
                        <th>Pages</th>
                        <th>Entry</th>
                        <th>Exit</th>
                        <th>Device</th>
                        <th>Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metrics?.browser?.recentSessions ?? []).map((s) => (
                        <tr key={s.id}>
                          <td className="max-w-[120px] truncate text-xs">
                            {s.name || s.email || '—'}
                          </td>
                          <td className="font-mono text-xs">{formatMs(s.activeMs)}</td>
                          <td className="font-mono text-xs">{s.pageCount}</td>
                          <td className="max-w-[100px] truncate font-mono text-[10px]">
                            {s.entryPath || '—'}
                          </td>
                          <td className="max-w-[100px] truncate font-mono text-[10px]">
                            {s.exitPath || '—'}
                          </td>
                          <td className="text-xs">{s.device || s.browser || '—'}</td>
                          <td className="font-mono text-[10px]">
                            {new Date(s.lastSeenAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {(metrics?.browser?.recentSessions ?? []).length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-[var(--admin-mute)]">
                            No sessions in range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AI Ops */}
          {section === 'ai' && (
            <div className="space-y-3">
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
                        <td className="max-w-[140px] truncate font-mono text-[10px]">
                          {e.model || '—'}
                        </td>
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
            </div>
          )}

          {/* Pipeline */}
          {section === 'pipeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-[var(--admin-soft)]">
                  Data pipeline
                </h2>
                <Link href="/admin/health" className="text-xs text-[#FF6B2B]">
                  Open System →
                </Link>
              </div>
              <Kpi
                label="Freshness"
                value={
                  metrics?.pipeline?.freshnessHours != null
                    ? `${metrics.pipeline.freshnessHours}h`
                    : '—'
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
            </div>
          )}

          {/* Revenue */}
          {section === 'revenue' && (
            <div className="space-y-3">
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
