import React from 'react';
import { Eye, TrendingUp, UserPlus, BarChart2 } from 'lucide-react';

const ANALYTICS_KPIS = [
  {
    id: 'an-views',
    label: 'Total Views',
    value: '1.24M',
    delta: '+18.4% vs last period',
    deltaPositive: true,
    icon: Eye,
    accentBg: 'bg-primary/10',
    accentIcon: 'text-primary',
  },
  {
    id: 'an-engagement',
    label: 'Avg Engagement Rate',
    value: '8.6%',
    delta: '+2.1pp vs last period',
    deltaPositive: true,
    icon: TrendingUp,
    accentBg: 'bg-accent/10',
    accentIcon: 'text-accent',
  },
  {
    id: 'an-followers',
    label: 'New Followers',
    value: '4,821',
    delta: '-312 vs last period',
    deltaPositive: false,
    icon: UserPlus,
    accentBg: 'bg-secondary/10',
    accentIcon: 'text-secondary',
  },
  {
    id: 'an-score',
    label: 'Avg NEMO Score',
    value: '61.4',
    delta: '+3.2 vs last period',
    deltaPositive: true,
    icon: BarChart2,
    accentBg: 'bg-purple-500/10',
    accentIcon: 'text-purple-400',
  },
];

export default function AnalyticsKPICards() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4">
      {ANALYTICS_KPIS?.map((kpi) => {
        const IconComponent = kpi?.icon;
        return (
          <div key={kpi?.id} className="card-surface p-4 xl:p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                {kpi?.label}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi?.accentBg}`}>
                <IconComponent size={16} className={kpi?.accentIcon} />
              </div>
            </div>
            <span className="font-mono-custom font-bold text-2xl xl:text-3xl text-foreground tabular-nums">
              {kpi?.value}
            </span>
            <span className={`text-xs font-sans ${kpi?.deltaPositive ? 'text-accent' : 'text-red-400'}`}>
              {kpi?.delta}
            </span>
          </div>
        );
      })}
    </div>
  );
}