'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { buildGeoChartRows, type GeoShare } from '@/lib/trends/geoChart';

interface GeoChartProps {
  regions?: string[];
  shares?: GeoShare[];
}

const tipStyle = {
  background: '#1c1916',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  fontSize: 12,
  color: '#f5f0eb',
};

export default function TrendGeoChart({ regions, shares }: GeoChartProps) {
  const data = useMemo(() => buildGeoChartRows({ regions, shares, limit: 10 }), [regions, shares]);

  const chartHeight = Math.max(200, data.length * 32 + 16);

  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
        Geographic Split
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center leading-relaxed">
          Country mix not available for this trend
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="region"
              width={110}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              contentStyle={tipStyle}
              formatter={(value: number) => [`${Math.round(value)}`, 'Interest']}
            />
            <Bar dataKey="share" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
