'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

type Metrics = {
  range: string;
  kpis: {
    estMrr: number;
    arpu: number;
    freeToPaidPct: number;
    onboardingRate: number;
    totalUsers: number;
    payingUsers: number;
  };
  growth: { date: string; signups: number }[];
  funnel: { step: string; count: number }[];
  platformVolume: { name: string; count: number }[];
  source: string;
};

type AdminUser = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  plan?: string | null;
};

type UserEvent = {
  id: string;
  event_name: string;
  event_category: string | null;
  page_path: string | null;
  created_at: string;
};

export default function AdminAnalyticsContent() {
  const [range, setRange] = useState('30d');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/metrics?range=${range}`)
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, [range]);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
  }, []);

  const loadEvents = useCallback((userId: string) => {
    setSelectedId(userId);
    setLoadingEvents(true);
    fetch(`/api/admin/users/${userId}/events`)
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d.events) ? d.events : []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  const k = metrics?.kpis;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
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
        <span className="ml-auto text-xs text-[var(--admin-mute)]">Source: {metrics?.source ?? '…'}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Est. MRR', value: k ? `₹${k.estMrr.toLocaleString('en-IN')}` : '—' },
          { label: 'ARPU (est.)', value: k ? `₹${k.arpu}` : '—' },
          { label: 'Free → Paid', value: k ? `${k.freeToPaidPct}%` : '—' },
          { label: 'Onboarding', value: k ? `${k.onboardingRate}%` : '—' },
        ].map((item) => (
          <div key={item.label} className="admin-kpi">
            <div className="admin-kpi-label">{item.label}</div>
            <div className="admin-kpi-value text-[1.5rem]">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold">User growth · signups</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.growth ?? []}>
                <defs>
                  <linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#8a8076', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8a8076', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: '#1c1916',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="signups" stroke="#FF5A1F" fill="url(#gFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold">Activation funnel</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.funnel ?? []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8a8076', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="step"
                  width={110}
                  tick={{ fill: '#c9bfb4', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1c1916',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#FF5A1F" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-card p-4">
        <h2 className="mb-3 font-display text-sm font-bold">Platform volume · linked socials</h2>
        <div className="flex flex-wrap gap-3">
          {(metrics?.platformVolume ?? []).map((p) => (
            <div key={p.name} className="rounded-xl border border-[var(--admin-line)] bg-[var(--admin-surface-2)] px-4 py-3">
              <div className="font-mono text-[10px] uppercase text-[var(--admin-mute)]">{p.name}</div>
              <div className="font-display text-xl font-bold">{p.count}</div>
            </div>
          ))}
          {(metrics?.platformVolume ?? []).length === 0 && (
            <p className="text-sm text-[var(--admin-mute)]">No connections yet</p>
          )}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="border-b border-[var(--admin-line)] px-4 py-3">
          <h2 className="font-display text-sm font-bold">User picker · event timeline</h2>
        </div>
        <div className="grid lg:grid-cols-2">
          <div className="max-h-80 overflow-auto border-r border-[var(--admin-line)]">
            {users.slice(0, 40).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => loadEvents(u.id)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[var(--admin-surface-2)] ${
                  selectedId === u.id ? 'bg-[rgba(255,90,31,0.1)]' : ''
                }`}
              >
                <span>
                  <span className="block font-medium text-[var(--admin-text)]">{u.full_name || '—'}</span>
                  <span className="text-xs text-[var(--admin-mute)]">{u.email}</span>
                </span>
                <span className="admin-pill admin-pill-free">{u.plan || 'free'}</span>
              </button>
            ))}
          </div>
          <div className="max-h-80 overflow-auto p-4">
            {loadingEvents && <p className="text-sm text-[var(--admin-mute)]">Loading…</p>}
            {!loadingEvents && !selectedId && (
              <p className="text-sm text-[var(--admin-mute)]">Select a user</p>
            )}
            {!loadingEvents &&
              events.map((e) => (
                <div key={e.id} className="mb-3 border-b border-[var(--admin-line)] pb-2 text-sm last:border-0">
                  <div className="font-medium">{e.event_name}</div>
                  <div className="font-mono text-[10px] text-[var(--admin-mute)]">
                    {e.event_category} · {new Date(e.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
