import React from 'react';
import { TrendingUp, Zap, BarChart2, Radio } from 'lucide-react';

const KPI_DATA = [
  {
    id: 'kpi-total',
    label: 'TOTAL DETECTED',
    value: '80',
    sub: 'Active trends',
    icon: TrendingUp,
    accent: 'flame',
  },
  {
    id: 'kpi-rising',
    label: 'RISING FAST',
    value: '80',
    sub: '+ High Momentum',
    icon: Zap,
    accent: 'amber',
  },
  {
    id: 'kpi-spike',
    label: 'AVG SPIKE SCORE',
    value: '+271%',
    sub: 'Across all niches',
    icon: BarChart2,
    accent: 'green',
  },
  {
    id: 'kpi-source',
    label: 'TOP SOURCE',
    value: 'YouTube',
    sub: 'Highest volume',
    icon: Radio,
    accent: 'muted',
  },
];

const ACCENT_MAP: Record<string, { border: string; icon: string; value: string; sub: string }> = {
  flame: {
    border: 'border-l-primary',
    icon: 'text-primary bg-primary/10',
    value: 'text-primary',
    sub: 'text-gray-800 dark:text-gray-100',
  },
  amber: {
    border: 'border-l-secondary',
    icon: 'text-secondary bg-secondary/10',
    value: 'text-secondary',
    sub: 'text-gray-800 dark:text-gray-100',
  },
  green: {
    border: 'border-l-accent',
    icon: 'text-accent bg-accent/10',
    value: 'text-accent',
    sub: 'text-gray-800 dark:text-gray-100',
  },
  muted: {
    border: 'border-l-border',
    icon: 'text-foreground bg-muted',
    value: 'text-gray-900 dark:text-gray-50',
    sub: 'text-gray-800 dark:text-gray-100',
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
            className={`card-surface p-3 xl:p-5 border-l-4 ${a.border} flex items-center gap-3 overflow-hidden`}
          >
            <div className={`w-9 h-9 xl:w-10 xl:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.icon}`}>
              <IconComponent size={16} />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[9px] xl:text-[10px] font-mono-custom uppercase tracking-widest text-gray-900 dark:text-gray-100 leading-tight mb-1 truncate">
                {kpi.label}
              </p>
              <p className={`font-mono-custom font-bold tabular-nums text-lg xl:text-2xl leading-none truncate ${a.value}`}>
                {kpi.value}
              </p>
              <p className={`text-[11px] font-sans mt-1 truncate ${a.sub}`}>
                {kpi.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}