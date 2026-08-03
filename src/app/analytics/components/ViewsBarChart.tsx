'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ANALYTICS_DAILY_DATA } from '@/lib/mockData';

const DISPLAY_DATA = ANALYTICS_DAILY_DATA.filter((_, i) => i % 2 === 0);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface p-3 shadow-card-hover text-xs">
      <p className="font-mono-custom text-muted-foreground mb-1">{label}</p>
      <p className="font-mono-custom font-bold text-primary tabular-nums">
        {payload[0]?.value?.toLocaleString()} views
      </p>
    </div>
  );
}

export default function ViewsBarChart() {
  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
        Views Over Time (28 Days)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={DISPLAY_DATA} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="views" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
