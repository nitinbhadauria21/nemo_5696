import React from 'react';
import { Users, Activity, Bookmark, Key } from 'lucide-react';

const ADMIN_KPIS = [
  {
    id: 'akpi-users',
    label: 'Total Users',
    value: '1,284',
    delta: '+38 this week',
    deltaPositive: true,
    icon: Users,
    accentBg: 'bg-primary/10',
    accentIcon: 'text-primary',
  },
  {
    id: 'akpi-sessions',
    label: 'Active Sessions',
    value: '247',
    delta: 'Right now',
    deltaPositive: true,
    icon: Activity,
    accentBg: 'bg-accent/10',
    accentIcon: 'text-accent',
  },
  {
    id: 'akpi-bookmarks',
    label: 'Total Bookmarks',
    value: '8,941',
    delta: '+312 today',
    deltaPositive: true,
    icon: Bookmark,
    accentBg: 'bg-secondary/10',
    accentIcon: 'text-secondary',
  },
  {
    id: 'akpi-apikeys',
    label: 'Active API Keys',
    value: '193',
    delta: '+12 this week',
    deltaPositive: true,
    icon: Key,
    accentBg: 'bg-purple-500/10',
    accentIcon: 'text-purple-400',
  },
];

export default function AdminKPICards() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4">
      {ADMIN_KPIS?.map((kpi) => {
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