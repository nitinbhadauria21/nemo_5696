'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VolumeChartProps {
  sparkline: number[];
}

export default function TrendVolumeChart({ sparkline }: VolumeChartProps) {
  const data = sparkline.map((value, i) => ({
    hour: `-${72 - i * 8}h`,
    volume: value * 1200,
  }));

  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
        72h Volume
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip />
          <Line type="monotone" dataKey="volume" stroke="var(--primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
