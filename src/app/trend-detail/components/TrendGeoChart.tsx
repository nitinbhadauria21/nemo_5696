'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface GeoChartProps {
  regions?: string[];
}

const REGION_LABELS: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  UK: 'United Kingdom',
  AE: 'UAE',
  SG: 'Singapore',
  AU: 'Australia',
};

export default function TrendGeoChart({ regions = ['IN', 'US', 'UK'] }: GeoChartProps) {
  const data = regions.slice(0, 6).map((code, i) => ({
    region: REGION_LABELS[code] || code,
    share: Math.max(12, 85 - i * 14),
  }));

  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
        Geographic Split
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="region" width={90} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="share" fill="var(--primary)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
