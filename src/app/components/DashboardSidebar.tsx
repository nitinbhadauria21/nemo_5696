import React from 'react';
import Link from 'next/link';
import { MOCK_TRENDS } from '@/lib/mockData';

import NemoScoreBadge from '@/components/ui/NemoScoreBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';

const TOP_TRENDS = MOCK_TRENDS?.filter((t) => t?.status === 'hot')?.slice(0, 4);

const PLATFORM_STATUS = [
  { id: 'ps-google', name: 'Google Trends', status: 'live', trends: 38, color: 'text-accent' },
  { id: 'ps-youtube', name: 'YouTube Shorts', status: 'live', trends: 28, color: 'text-accent' },
  { id: 'ps-instagram', name: 'Instagram Reels', status: 'limited', trends: 22, color: 'text-secondary' },
  { id: 'ps-linkedin', name: 'LinkedIn', status: 'mock', trends: 12, color: 'text-muted-foreground' },
];

export default function DashboardSidebar() {
  return (
    <div className="flex flex-col gap-3">
      {/* Trending For You */}
      <div className="card-surface p-4">
        <h3 className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mb-3">
          Trending For You
        </h3>
        <ul className="space-y-3">
          {TOP_TRENDS?.map((trend) => (
            <li key={`sidebar-trend-${trend?.id}`}>
              <Link href={`/trend/${trend?.id}`} className="flex items-start gap-2 group">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-sans font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {trend?.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {trend?.platforms?.slice(0, 2)?.map((p) => (
                      <PlatformBadge key={`sidebar-plat-${trend?.id}-${p}`} platform={p} size="sm" />
                    ))}
                  </div>
                </div>
                <NemoScoreBadge score={trend?.nemoScore} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* Platform Status */}
      <div className="card-surface p-4">
        <h3 className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mb-3">
          Platform Status
        </h3>
        <ul className="space-y-2.5">
          {PLATFORM_STATUS?.map((ps) => (
            <li key={ps?.id} className="flex items-center justify-between">
              <span className="text-base font-sans text-foreground font-medium">{ps?.name}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono-custom font-bold tabular-nums ${ps?.color}`}>
                  {ps?.trends}%
                </span>
                <span
                  className={`text-sm font-mono-custom uppercase px-1.5 py-0.5 rounded-full ${
                    ps?.status === 'live' ? 'bg-accent/10 text-accent'
                      : ps?.status === 'limited' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-foreground/60'
                  }`}
                >
                  {ps?.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Auto-refresh notice */}
      <div className="card-surface p-3 border-primary/20">
        <p className="text-base text-foreground/65 font-sans leading-relaxed">
          <span className="text-primary font-semibold">Auto-refresh</span> every 10 min.
          Next refresh in <span className="font-mono-custom text-foreground font-bold">8:42</span>
        </p>
      </div>
    </div>
  );
}