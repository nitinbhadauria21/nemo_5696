'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MRR_DATA = [
  { month: 'Mar', mrr: 42000 },
  { month: 'Apr', mrr: 58000 },
  { month: 'May', mrr: 71000 },
  { month: 'Jun', mrr: 89000 },
  { month: 'Jul', mrr: 112000 },
];

const PLAN_SPLIT = [
  { name: 'Free', value: 72, color: 'hsl(var(--muted-foreground))' },
  { name: 'Pro', value: 22, color: 'hsl(var(--primary))' },
  { name: 'Agency', value: 6, color: 'hsl(var(--accent))' },
];

export default function AdminRevenueContent() {
  const [stats, setStats] = useState({ proUsers: 0, agencyUsers: 0, totalUsers: 0 });

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const estimatedMrr = stats.proUsers * 799 + stats.agencyUsers * 2499;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold mb-1">Revenue Dashboard</h1>
        <p className="text-muted-foreground text-sm">MRR, plan conversion, and Razorpay settlements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-surface p-4">
          <p className="text-xs font-mono-custom uppercase text-muted-foreground">Est. MRR</p>
          <p className="font-display text-2xl font-bold mt-1">₹{estimatedMrr.toLocaleString('en-IN')}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs font-mono-custom uppercase text-muted-foreground">Pro Subscribers</p>
          <p className="font-display text-2xl font-bold mt-1">{stats.proUsers}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs font-mono-custom uppercase text-muted-foreground">Agency Subscribers</p>
          <p className="font-display text-2xl font-bold mt-1">{stats.agencyUsers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">MRR Trend (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MRR_DATA}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
              <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={PLAN_SPLIT} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {PLAN_SPLIT.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
