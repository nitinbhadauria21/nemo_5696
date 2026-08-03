'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type Stats = {
  totalUsers: number;
  estMrr: number;
  activeToday: number;
  aiCalls24h: number;
  events24h: number;
  proUsers: number;
  agencyUsers: number;
};

type Signup = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  plan?: string | null;
  created_at?: string | null;
  onboarding_complete?: boolean | null;
};

function planPill(plan?: string | null) {
  const p = (plan || 'free').toLowerCase();
  const cls =
    p === 'agency' ? 'admin-pill-agency' : p === 'pro' ? 'admin-pill-pro' : 'admin-pill-free';
  return <span className={`admin-pill ${cls}`}>{p}</span>;
}

export default function AdminOverviewContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [chart, setChart] = useState<{ date: string; events: number; ai: number }[]>([]);
  const [attention, setAttention] = useState<{ type: string; label: string; href?: string }[]>([]);
  const [health, setHealth] = useState<Record<string, string>>({});
  const [source, setSource] = useState('…');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats ?? null);
        setSignups(d.recentSignups ?? []);
        setChart(d.usageChart ?? []);
        setAttention(d.attention ?? []);
        setHealth(d.health ?? {});
        setSource(d.source ?? 'unknown');
      })
      .catch(() => {});
  }, []);

  const kpis = [
    { label: 'Total users', value: stats?.totalUsers ?? '—' },
    {
      label: 'Est. MRR',
      value: stats ? `₹${stats.estMrr.toLocaleString('en-IN')}` : '—',
    },
    { label: 'Active today', value: stats?.activeToday ?? '—' },
    { label: 'AI calls 24h', value: stats?.aiCalls24h ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--admin-mute)]">Source: {source}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="admin-kpi">
            <div className="admin-kpi-label">{k.label}</div>
            <div className="admin-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-card flex flex-wrap gap-4 px-4 py-3">
        {Object.entries(health).map(([key, status]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                status === 'operational' ? 'bg-[var(--admin-ok)]' : 'bg-[var(--admin-bad)]'
              }`}
            />
            <span className="capitalize text-[var(--admin-soft)]">{key}</span>
            <span
              className={`font-mono text-[10px] uppercase ${
                status === 'operational' ? 'admin-health-ok' : 'admin-health-bad'
              }`}
            >
              {status}
            </span>
          </div>
        ))}
        <div className="ml-auto text-xs text-[var(--admin-mute)]">
          Events 24h: {stats?.events24h ?? '—'} · Pro {stats?.proUsers ?? 0} · Agency{' '}
          {stats?.agencyUsers ?? 0}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="admin-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold">Usage · 14 days</h2>
              <span className="font-mono text-[10px] uppercase text-[var(--admin-mute)]">
                Events / AI
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="evFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8a8076', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8a8076', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1c1916',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#FF5A1F"
                    fill="url(#evFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="ai"
                    stroke="#3DD68C"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-4 py-3">
              <h2 className="font-display text-sm font-bold">Recent signups</h2>
              <Link href="/admin/users" className="text-xs text-[#FF6B2B] hover:underline">
                View all →
              </Link>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {signups.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium text-[var(--admin-text)]">
                        {u.full_name || '—'}
                      </div>
                      <div className="text-xs text-[var(--admin-mute)]">{u.email}</div>
                    </td>
                    <td>{planPill(u.plan)}</td>
                    <td className="font-mono text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="admin-btn text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {signups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[var(--admin-mute)]">
                      No signups yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="admin-card p-4">
            <h2 className="mb-3 font-display text-sm font-bold">Attention</h2>
            <ul className="space-y-2">
              {attention.length === 0 && (
                <li className="text-sm text-[var(--admin-mute)]">All clear</li>
              )}
              {attention.map((a, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-[var(--admin-line)] bg-[var(--admin-surface-2)] px-3 py-2 text-sm"
                >
                  {a.href ? (
                    <Link href={a.href} className="text-[var(--admin-soft)] hover:text-[#FF6B2B]">
                      {a.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--admin-soft)]">{a.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="admin-card p-4 opacity-80">
            <h2 className="mb-2 font-display text-sm font-bold">Support tickets</h2>
            <p className="text-sm text-[var(--admin-mute)]">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
