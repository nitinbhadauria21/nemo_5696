'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export type RealtimeStatusProps = {
  lastIngestAt: string | null;
  trendCount: number;
  sourcesActive: number;
  sourcesUnavailable: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  sourceLabel?: string;
};

function formatAgo(iso: string | null): string {
  if (!iso) return 'never';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'unknown';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RealtimeStatus({
  lastIngestAt,
  trendCount,
  sourcesActive,
  sourcesUnavailable,
  isRefreshing,
  onRefresh,
  sourceLabel,
}: RealtimeStatusProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-sans">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">Near real-time</span>
        </span>
        <span className="text-foreground/65">
          Last ingest:{' '}
          <span className="font-medium text-foreground">{formatAgo(lastIngestAt)}</span>
        </span>
        <span className="text-foreground/65">
          Sources:{' '}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            {sourcesActive} active
          </span>
          {sourcesUnavailable > 0 && (
            <>
              {' · '}
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {sourcesUnavailable} unavailable
              </span>
            </>
          )}
        </span>
        <span className="text-foreground/65">
          Trends: <span className="font-medium text-foreground">{trendCount}</span>
        </span>
        {sourceLabel && (
          <span className="text-foreground/50 text-xs uppercase tracking-wide">{sourceLabel}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-border bg-muted hover:bg-muted/80 disabled:opacity-50"
      >
        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>
  );
}
