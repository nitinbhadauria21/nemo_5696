'use client';

import React from 'react';
import type { LifecycleStatus } from '@/lib/mockData';

const CONFIG: Record<LifecycleStatus, { label: string; className: string }> = {
  emerging: {
    label: 'Emerging',
    className: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  },
  rising: {
    label: 'Rising',
    className: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30',
  },
  breakout: {
    label: 'Breakout',
    className: 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30',
  },
  trending: {
    label: 'Trending',
    className: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30',
  },
  stable: {
    label: 'Stable',
    className: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  },
  fading: {
    label: 'Fading',
    className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25',
  },
  recycled: {
    label: 'Recycled',
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/25',
  },
};

export default function TrendStatusBadge({
  lifecycle,
  fallback,
}: {
  lifecycle?: LifecycleStatus;
  fallback?: 'hot' | 'rising' | 'fading';
}) {
  const key: LifecycleStatus =
    lifecycle || (fallback === 'hot' ? 'trending' : fallback === 'fading' ? 'fading' : 'rising');
  const cfg = CONFIG[key];
  return (
    <span
      className={`text-[0.75rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
