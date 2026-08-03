'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WEEKDAY_ENGAGEMENT } from '@/lib/mockData';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface p-3 shadow-card-hover text-xs">
      <p className="font-mono-custom text-muted-foreground mb-1">{label}</p>
      <p className="font-mono-custom font-bold text-accent tabular-nums">
        {payload[0]?.value?.toFixed(1)}% engagement
      </p>
    </div>
  );
}

export default function EngagementLineChart() {
  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
        Engagement by Weekday
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={WEEKDAY_ENGAGEMENT}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 4 }}
            activeDot={{ r: 6, fill: 'var(--accent)' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground font-sans mt-2">
        Peak: <span className="font-mono-custom text-foreground font-bold">Thursday 9.4%</span> ·
        Lowest: <span className="font-mono-custom text-foreground">Sunday 5.8%</span>
      </p>
    </div>
  );
}
