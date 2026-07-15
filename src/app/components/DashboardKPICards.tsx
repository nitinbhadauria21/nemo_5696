import React from 'react';
import { TrendingUp, Zap, BarChart2, Radio } from 'lucide-react';

const KPI_DATA = [
  {
    id: 'kpi-total',
    label: 'Total Detected',
    value: '80',
    sub: 'Active trends',
    icon: TrendingUp,
    accent: 'flame',
  },
  {
    id: 'kpi-rising',
    label: 'Rising Fast',
    value: '80',
    sub: 'High momentum',
    icon: Zap,
    accent: 'amber',
  },
  {
    id: 'kpi-spike',
    label: 'Avg Spike Score',
    value: '+271%',
    sub: 'Across all niches',
    icon: BarChart2,
    accent: 'green',
  },
  {
    id: 'kpi-source',
    label: 'Top Source',
    value: 'YouTube',
    sub: 'Highest volume',
    icon: Radio,
    accent: 'muted',
  },
];

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

export default function DashboardKPICards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {KPI_DATA.map((kpi) => {
        const a = ACCENT_MAP[kpi.accent];
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`${a.bg} border ${a.border} rounded-2xl p-4 flex items-center gap-3`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${a.icon}`}>
              <IconComponent size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono-custom text-sm font-bold text-foreground/60 uppercase tracking-wider leading-tight mb-1 truncate">
                {kpi.label}
              </p>
              <p className={`font-display font-extrabold tabular-nums text-2xl leading-none truncate ${a.value}`}>
                {kpi.value}
              </p>
              <p className="text-sm font-sans text-foreground/65 mt-1 truncate">
                {kpi.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}