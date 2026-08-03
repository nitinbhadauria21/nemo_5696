'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Sparkles, Bookmark, ListTodo, CalendarDays } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type Summary = {
  range: string;
  kpis: {
    events: number;
    aiCalls: number;
    bookmarks: number;
    queueActions: number;
    activeDays: number;
  };
  byDay: { date: string; count: number }[];
  byCategory: { name: string; count: number; value: number; color: string }[];
  topEvents: { name: string; count: number }[];
  source: string;
};

const RANGES = ['7d', '30d', '90d'] as const;

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-surface p-8 text-center text-sm text-muted-foreground font-sans">{children}</div>
  );
}

export default function AnalyticsContent() {
  const [range, setRange] = useState<(typeof RANGES)[number]>('30d');
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/summary?range=${range}`)
      .then(async (r) => {
        if (r.status === 401) throw new Error('Sign in to view your activity analytics');
        if (!r.ok) throw new Error('Failed to load analytics');
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const kpis = data?.kpis;
  const kpiCards = [
    {
      id: 'events',
      label: 'Events',
      value: kpis?.events ?? 0,
      icon: Activity,
      accentBg: 'bg-primary/10',
      accentIcon: 'text-primary',
    },
    {
      id: 'ai',
      label: 'AI calls',
      value: kpis?.aiCalls ?? 0,
      icon: Sparkles,
      accentBg: 'bg-accent/10',
      accentIcon: 'text-accent',
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      value: kpis?.bookmarks ?? 0,
      icon: Bookmark,
      accentBg: 'bg-secondary/10',
      accentIcon: 'text-secondary',
    },
    {
      id: 'queue',
      label: 'Queue actions',
      value: kpis?.queueActions ?? 0,
      icon: ListTodo,
      accentBg: 'bg-blue-500/10',
      accentIcon: 'text-blue-500',
    },
    {
      id: 'days',
      label: 'Active days',
      value: kpis?.activeDays ?? 0,
      icon: CalendarDays,
      accentBg: 'bg-purple-500/10',
      accentIcon: 'text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/98 backdrop-blur border-b border-border px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-base text-foreground/65 font-sans">
            Your in-app activity — events, AI usage, bookmarks, and queue
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-full p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full text-sm font-mono-custom font-bold uppercase transition-all duration-150 ${
                range === r ? 'bg-primary text-white shadow-flame-sm' : 'text-foreground/65 hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 max-w-screen-2xl mx-auto space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 font-sans">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 xl:gap-4">
          {kpiCards.map((kpi) => {
            const IconComponent = kpi.icon;
            return (
              <div key={kpi.id} className="card-surface p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold">
                    {kpi.label}
                  </span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.accentBg}`}>
                    <IconComponent size={17} className={kpi.accentIcon} />
                  </div>
                </div>
                <span className="font-mono-custom font-bold text-2xl xl:text-3xl text-foreground tabular-nums">
                  {loading ? '—' : kpi.value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 card-surface p-5">
            <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
              Events over time ({range})
            </h3>
            {!loading && (data?.byDay?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground font-sans py-12 text-center">
                No events in this range yet. Use the app to start collecting activity.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.byDay ?? []} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value} events`, 'Count']}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card-surface p-5">
            <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
              By category
            </h3>
            {(data?.byCategory?.length ?? 0) === 0 && !loading ? (
              <p className="text-sm text-muted-foreground font-sans py-12 text-center">No category data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data?.byCategory ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {(data?.byCategory ?? []).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {(data?.byCategory ?? []).map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-xs font-sans text-muted-foreground">{p.name}</span>
                      </div>
                      <span className="text-xs font-mono-custom font-bold text-foreground tabular-nums">
                        {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
            Top actions
          </h3>
          {(data?.topEvents?.length ?? 0) === 0 && !loading ? (
            <EmptyHint>No actions recorded yet.</EmptyHint>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 font-mono-custom text-xs uppercase text-muted-foreground">Event</th>
                    <th className="py-2 font-mono-custom text-xs uppercase text-muted-foreground text-right">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topEvents ?? []).map((row) => (
                    <tr key={row.name} className="border-b border-border/60">
                      <td className="py-2.5 font-sans text-foreground">{row.name}</td>
                      <td className="py-2.5 font-mono-custom font-bold text-right tabular-nums">
                        {row.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
