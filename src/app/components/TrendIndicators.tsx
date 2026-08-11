'use client';

import React from 'react';

export function VelocityIndicator({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`tabular-nums font-semibold ${up ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}
    >
      {up ? '↑' : '↓'} {Math.abs(value).toFixed(2)}x
    </span>
  );
}

export function FreshnessIndicator({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'text-emerald-700 dark:text-emerald-400'
      : score >= 40
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-red-600';
  return <span className={`tabular-nums font-semibold ${color}`}>{Math.round(score)}</span>;
}

export function CrossPlatformIndicator({
  platforms,
  score,
}: {
  platforms: string[];
  score: number;
}) {
  return (
    <span className="text-sm text-foreground/70">
      {platforms.length} platforms · CPS {Math.round(score)}
    </span>
  );
}

export function ConfidenceChip({ level }: { level?: 'High' | 'Moderate' | 'Low' }) {
  const l = level || 'Low';
  const cls =
    l === 'High'
      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
      : l === 'Moderate'
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
        : 'bg-gray-500/15 text-gray-700 dark:text-gray-300';
  return (
    <span
      className={`text-[0.7rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${cls}`}
    >
      {l} conf.
    </span>
  );
}
