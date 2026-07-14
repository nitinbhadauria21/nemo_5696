'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Music2, ChevronRight } from 'lucide-react';
import type { TrendItem, TrendPlatform, TrendContentType } from '@/lib/mockData';

interface TrendCardProps {
  trend: TrendItem;
  onBookmarkToggle?: (id: string) => void;
}

const PLATFORM_LABELS: Record<TrendPlatform, string> = {
  google: 'Google Trends',
  youtube: 'YouTube',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  reddit: 'Reddit',
};

const PLATFORM_COLORS: Record<TrendPlatform, string> = {
  google: 'text-blue-500',
  youtube: 'text-red-500',
  instagram: 'text-pink-500',
  linkedin: 'text-sky-600',
  tiktok: 'text-cyan-500',
  twitter: 'text-sky-400',
  reddit: 'text-orange-500',
};

const STATUS_CONFIG = {
  hot: { label: 'HOT', dot: 'bg-primary', text: 'text-primary' },
  rising: { label: 'RISING', dot: 'bg-secondary', text: 'text-secondary' },
  fading: { label: 'FADING', dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
};

const CONTENT_TYPE_COLORS: Record<TrendContentType, string> = {
  TOPIC: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  HOOK: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  CONCEPT: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  KEYWORD: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

function getScoreColor(score: number) {
  if (score >= 70) return 'text-primary';
  if (score >= 40) return 'text-secondary';
  return 'text-red-500';
}

export default function TrendCard({ trend, onBookmarkToggle }: TrendCardProps) {
  const [bookmarked, setBookmarked] = useState(trend.isBookmarked);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked((b) => !b);
    onBookmarkToggle?.(trend.id);
  };

  const primaryPlatform = trend.platforms[0];
  const statusConfig = STATUS_CONFIG[trend.status];
  const spikePositive = trend.spike >= 0;

  return (
    <div className="card-surface flex flex-col group hover:border-primary/30 transition-colors duration-200">
      {/* Card Header: Platform · Time · Status */}
      <div className="px-4 pt-3.5 pb-2.5 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <span className={`text-[11px] font-mono-custom font-bold uppercase tracking-wide truncate ${PLATFORM_COLORS[primaryPlatform]}`}>
            {PLATFORM_LABELS[primaryPlatform]}
          </span>
          <span className="text-muted-foreground text-[11px] font-sans flex-shrink-0">·</span>
          <span className="text-[11px] font-sans text-muted-foreground flex-shrink-0">{trend.timeAgo}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
          <span className={`text-[10px] font-mono-custom font-bold uppercase tracking-widest ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2.5">
        {/* Content Type + Category */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-mono-custom font-bold uppercase tracking-widest px-2 py-0.5 rounded ${CONTENT_TYPE_COLORS[trend.contentType]}`}>
            {trend.contentType}
          </span>
          <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-wide">
            {trend.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-sans font-semibold text-foreground leading-snug line-clamp-2">
          {trend.title}
        </h3>

        {/* Trending Audio (for HOOK type) */}
        {trend.trendingAudio && (
          <div className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground">
            <Music2 size={11} className="text-primary flex-shrink-0" />
            <span className="truncate italic">{trend.trendingAudio}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="px-4 py-2.5 bg-muted/40 border-t border-border grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-mono-custom uppercase tracking-widest text-muted-foreground">Velocity</span>
          <span className="text-xs font-mono-custom font-bold text-foreground tabular-nums">
            {trend.velocity.toFixed(2)}x
            <span className="text-[9px] font-sans text-muted-foreground ml-0.5">vs 72h</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-mono-custom uppercase tracking-widest text-muted-foreground">Spike</span>
          <span className={`text-xs font-mono-custom font-bold tabular-nums ${spikePositive ? 'text-accent' : 'text-red-500'}`}>
            {spikePositive ? '+' : ''}{trend.spike}%
            <span className="text-[9px] font-sans text-muted-foreground ml-0.5">24h</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-[9px] font-mono-custom uppercase tracking-widest text-muted-foreground">Score</span>
          <span className={`text-sm font-mono-custom font-bold tabular-nums ${getScoreColor(trend.nemoScore)}`}>
            {trend.nemoScore}<span className="text-[9px] text-muted-foreground">/100</span>
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
        <button
          onClick={handleBookmark}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this trend'}
        >
          {bookmarked ? (
            <BookmarkCheck size={14} className="text-primary" />
          ) : (
            <Bookmark size={14} className="text-muted-foreground" />
          )}
        </button>
        <Link
          href="/trend-detail"
          className="flex items-center gap-1 text-xs font-sans font-semibold text-primary hover:underline"
        >
          View Details
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}