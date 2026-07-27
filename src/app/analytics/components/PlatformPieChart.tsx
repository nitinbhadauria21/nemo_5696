'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PLATFORM_DISTRIBUTION } from '@/lib/mockData';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface p-3 shadow-card-hover text-xs">
      <p className="font-sans font-medium text-foreground">{payload[0]?.name}</p>
      <p className="font-mono-custom font-bold tabular-nums" style={{ color: payload[0]?.payload?.color }}>
        {payload[0]?.value}% of trends
      </p>
    </div>
  );
}

export default function PlatformPieChart() {
  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
        Trend Distribution by Platform
      </h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={PLATFORM_DISTRIBUTION}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
            >
              {PLATFORM_DISTRIBUTION.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-2">
        {PLATFORM_DISTRIBUTION.map((p) => (
          <div key={`legend-${p.name}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-xs font-sans text-muted-foreground">{p.name}</span>
            </div>
            <span className="text-xs font-mono-custom font-bold text-foreground tabular-nums">{p.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
