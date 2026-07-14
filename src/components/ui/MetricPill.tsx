import React from 'react';

interface MetricPillProps {
  label: string;
  value: string | number;
  color?: 'default' | 'flame' | 'amber' | 'green';
}

const COLOR_MAP = {
  default: 'bg-muted text-muted-foreground',
  flame: 'bg-primary/10 text-primary',
  amber: 'bg-secondary/10 text-secondary',
  green: 'bg-accent/10 text-accent',
};

export default function MetricPill({ label, value, color = 'default' }: MetricPillProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${COLOR_MAP[color]}`}>
      <span className="text-xs font-mono-custom uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-xs font-bold font-mono-custom tabular-nums">{value}</span>
    </div>
  );
}