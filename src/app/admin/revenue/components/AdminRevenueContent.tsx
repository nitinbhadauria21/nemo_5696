'use client';

import React, { useEffect, useState } from 'react';
import {
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
} from 'recharts';

const COLORS = ['#8a8076', '#FF5A1F', '#3DD68C'];

export default function AdminRevenueContent() {
  const [planMix, setPlanMix] = useState<{ name: string; value: number; mrr: number }[]>([]);
  const [estMrr, setEstMrr] = useState(0);
  const [source, setSource] = useState('…');

  useEffect(() => {
    fetch('/api/admin/metrics?range=90d')
      .then((r) => r.json())
      .then((d) => {
        setPlanMix(d.planMix ?? []);
        setEstMrr(d.kpis?.estMrr ?? 0);
        setSource(d.source ?? 'unknown');
      })
      .catch(() => {});
  }, []);

  const trend = planMix.length
    ? [
        { month: 'Est. now', mrr: estMrr },
        { month: '+1m*', mrr: Math.round(estMrr * 1.08) },
        { month: '+2m*', mrr: Math.round(estMrr * 1.15) },
        { month: '+3m*', mrr: Math.round(estMrr * 1.22) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <p className="text-xs text-[var(--admin-mute)]">
        Source: {source} · *trend is illustrative from current plan mix (not Razorpay settlements)
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="admin-kpi">
          <div className="admin-kpi-label">Est. MRR</div>
          <div className="admin-kpi-value">₹{estMrr.toLocaleString('en-IN')}</div>
        </div>
        {planMix
          .filter((p) => p.name !== 'Free')
          .map((p) => (
            <div key={p.name} className="admin-kpi">
              <div className="admin-kpi-label">{p.name} · seats</div>
              <div className="admin-kpi-value">{p.value}</div>
              <div className="mt-1 text-xs text-[var(--admin-mute)]">
                ₹{p.mrr.toLocaleString('en-IN')} / mo
              </div>
            </div>
          ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold">MRR trend (₹)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#8a8076', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8a8076', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={(v: number) => `₹${Number(v).toLocaleString('en-IN')}`}
                  contentStyle={{
                    background: '#1c1916',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="mrr" fill="#FF5A1F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold">Plan mix</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {planMix.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1c1916',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
