'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const GROWTH_DATA = [
  { week: 'W1', signups: 42, active: 28 },
  { week: 'W2', signups: 58, active: 41 },
  { week: 'W3', signups: 71, active: 52 },
  { week: 'W4', signups: 89, active: 67 },
];

const RETENTION = [
  { cohort: 'Jun W1', d7: 68, d14: 52, d30: 41 },
  { cohort: 'Jun W2', d7: 71, d14: 55, d30: 44 },
  { cohort: 'Jun W3', d7: 65, d14: 49, d30: 38 },
];

export default function AdminAnalyticsContent() {
  const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, trendsToday: 0 });

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">User Analytics</h1>
        <p className="text-muted-foreground text-sm">Growth, retention, and funnel metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'Pro Users', value: stats.proUsers },
          { label: 'Trends Today', value: stats.trendsToday },
        ].map((kpi) => (
          <div key={kpi.label} className="card-surface p-4">
            <p className="text-xs font-mono-custom uppercase text-muted-foreground">{kpi.label}</p>
            <p className="font-display text-2xl font-bold mt-1">{kpi.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">Weekly Signups</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={GROWTH_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">Active Users</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={GROWTH_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="active" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-surface p-5 overflow-x-auto">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">Retention Cohorts (%)</h3>
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2 pr-4">Cohort</th>
              <th className="py-2 pr-4">D7</th>
              <th className="py-2 pr-4">D14</th>
              <th className="py-2">D30</th>
            </tr>
          </thead>
          <tbody>
            {RETENTION.map((row) => (
              <tr key={row.cohort} className="border-b border-border/50">
                <td className="py-2.5 font-mono-custom text-xs">{row.cohort}</td>
                <td className="py-2.5">{row.d7}%</td>
                <td className="py-2.5">{row.d14}%</td>
                <td className="py-2.5">{row.d30}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
