'use client';

import React from 'react';
import { TrendingUp, Zap, BarChart2, Radio } from 'lucide-react';
import type { TrendItem } from '@/lib/mockData';

const ACCENT_MAP: Record<string, { bg: string; icon: string; value: string; border: string }> = {
  flame: {
    bg: 'bg-primary/8',
    border: 'border-primary/25',
    icon: 'text-primary bg-primary/12',
    value: 'text-primary',
  },
  amber: {
    bg: 'bg-secondary/8',
    border: 'border-secondary/25',
    icon: 'text-secondary bg-secondary/12',
    value: 'text-secondary',
  },
  green: {
    bg: 'bg-accent/8',
    border: 'border-accent/25',
    icon: 'text-accent bg-accent/12',
    value: 'text-accent',
  },
  muted: {
    bg: 'bg-card',
    border: 'border-border',
    icon: 'text-foreground bg-muted',
    value: 'text-foreground',
  },
};

export default function DashboardKPICards({ trends }: { trends: TrendItem[] }) {
  const total = trends.length;
  const rising = trends.filter((t) => t.status === 'rising' || t.status === 'hot').length;
  const avgSpike =
    total > 0 ? Math.round(trends.reduce((sum, t) => sum + (t.velocity || 0), 0) / total) : 0;

  const platformCounts: Record<string, number> = {};
  for (const t of trends) {
    for (const p of t.platforms || []) {
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    }
  }
  const topSource = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const kpiData = [
    {
      id: 'kpi-total',
      label: 'Total Detected',
      value: String(total),
      sub: 'Active trends',
      icon: TrendingUp,
      accent: 'flame',
    },
    {
      id: 'kpi-rising',
      label: 'Rising Fast',
      value: String(rising),
      sub: 'High momentum',
      icon: Zap,
      accent: 'amber',
    },
    {
      id: 'kpi-spike',
      label: 'Avg Velocity',
      value: avgSpike ? `+${avgSpike}%` : '—',
      sub: 'Across feed',
      icon: BarChart2,
      accent: 'green',
    },
    {
      id: 'kpi-source',
      label: 'Top Source',
      value: topSource === '—' ? '—' : topSource.charAt(0).toUpperCase() + topSource.slice(1),
      sub: 'Highest volume',
      icon: Radio,
      accent: 'muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpiData.map((kpi) => {
        const a = ACCENT_MAP[kpi.accent];
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`${a.bg} border ${a.border} rounded-2xl p-4 flex items-center gap-3`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${a.icon}`}
            >
              <IconComponent size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono-custom text-sm font-bold text-foreground/60 uppercase tracking-wider leading-tight mb-1 truncate">
                {kpi.label}
              </p>
              <p
                className={`font-display font-extrabold tabular-nums text-2xl leading-none truncate ${a.value}`}
              >
                {kpi.value}
              </p>
              <p className="text-sm font-sans text-foreground/65 mt-1 truncate">{kpi.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
