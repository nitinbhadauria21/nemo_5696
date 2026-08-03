'use client';

import React from 'react';
import Link from 'next/link';
import type { TrendItem } from '@/lib/mockData';
import NemoScoreBadge from '@/components/ui/NemoScoreBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';

const PLATFORM_LABELS: { id: string; name: string }[] = [
  { id: 'google', name: 'Google Trends' },
  { id: 'youtube', name: 'YouTube Shorts' },
  { id: 'instagram', name: 'Instagram Reels' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
];

export default function DashboardSidebar({ trends }: { trends: TrendItem[] }) {
  const topTrends = trends.filter((t) => t.status === 'hot' || t.status === 'rising').slice(0, 4);

  const platformStatus = PLATFORM_LABELS.map((p) => {
    const count = trends.filter((t) =>
      t.platforms?.includes(p.id as TrendItem['platforms'][number])
    ).length;
    const pct = trends.length ? Math.round((count / trends.length) * 100) : 0;
    return {
      ...p,
      count,
      pct,
      status: count > 0 ? 'live' : 'idle',
    };
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="card-surface p-4">
        <h3 className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mb-3">
          Trending For You
        </h3>
        {topTrends.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hot trends yet — refresh the feed.</p>
        ) : (
          <ul className="space-y-3">
            {topTrends.map((trend) => (
              <li key={`sidebar-trend-${trend.id}`}>
                <Link href={`/trend/${trend.id}`} className="flex items-start gap-2 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-sans font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {trend.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {trend.platforms?.slice(0, 2)?.map((p) => (
                        <PlatformBadge
                          key={`sidebar-plat-${trend.id}-${p}`}
                          platform={p}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                  <NemoScoreBadge score={trend.nemoScore} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-surface p-4">
        <h3 className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mb-3">
          Platform mix
        </h3>
        <ul className="space-y-2.5">
          {platformStatus.map((ps) => (
            <li key={ps.id} className="flex items-center justify-between">
              <span className="text-base font-sans text-foreground font-medium">{ps.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono-custom font-bold tabular-nums text-foreground/70">
                  {ps.pct}%
                </span>
                <span
                  className={`text-sm font-mono-custom uppercase px-1.5 py-0.5 rounded-full ${
                    ps.status === 'live'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-muted text-foreground/60'
                  }`}
                >
                  {ps.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-surface p-3 border-primary/20">
        <p className="text-base text-foreground/65 font-sans leading-relaxed">
          <span className="text-primary font-semibold">Auto-refresh</span> every 10 min from live
          collectors.
        </p>
      </div>
    </div>
  );
}
