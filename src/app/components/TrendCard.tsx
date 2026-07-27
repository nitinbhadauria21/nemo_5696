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
  google: 'Google',
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
  hot: { label: 'HOT 🔥', dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10 border-primary/25' },
  rising: { label: 'RISING 📈', dot: 'bg-secondary', text: 'text-secondary', bg: 'bg-secondary/10 border-secondary/25' },
  fading: { label: 'FADING', dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted border-border' },
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
    <div className="bg-card border-2 border-border rounded-2xl flex flex-col group hover:border-primary/40 hover:shadow-flame-sm transition-all duration-200 trend-card-hover">
      {/* Card Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className={`text-sm font-bold font-mono-custom uppercase tracking-wide truncate ${PLATFORM_COLORS[primaryPlatform]}`}>
            {PLATFORM_LABELS[primaryPlatform]}
          </span>
          <span className="text-foreground/40 text-sm">·</span>
          <span className="text-sm font-sans text-foreground/60 flex-shrink-0">{trend.timeAgo}</span>
        </div>
        <span className={`text-sm font-mono-custom font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex-shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Card Body */}
      <div className="px-4 py-3.5 flex-1 flex flex-col gap-2.5">
        {/* Content Type + Category */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-mono-custom font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${CONTENT_TYPE_COLORS[trend.contentType]}`}>
            {trend.contentType}
          </span>
          <span className="text-sm font-sans text-foreground/65 font-medium">
            {trend.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 font-display group-hover:text-primary transition-colors">
          {trend.title}
        </h3>

        {/* Trending Audio */}
        {trend.trendingAudio && (
          <div className="flex items-center gap-1.5 text-sm font-sans text-foreground/60">
            <Music2 size={13} className="text-primary flex-shrink-0" />
            <span className="truncate italic">{trend.trendingAudio}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="px-4 py-3 bg-muted/50 border-t border-border grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono-custom text-sm uppercase tracking-wider text-foreground/55 font-semibold">Velocity</span>
          <span className="text-base font-mono-custom font-bold text-foreground tabular-nums">
            {trend.velocity.toFixed(2)}x
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono-custom text-sm uppercase tracking-wider text-foreground/55 font-semibold">Spike</span>
          <span className={`text-base font-mono-custom font-bold tabular-nums ${spikePositive ? 'text-accent' : 'text-red-500'}`}>
            {spikePositive ? '+' : ''}{trend.spike}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <span className="font-mono-custom text-sm uppercase tracking-wider text-foreground/55 font-semibold">Score</span>
          <span className={`text-lg font-mono-custom font-extrabold tabular-nums ${getScoreColor(trend.nemoScore)}`}>
            {trend.nemoScore}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <button
          onClick={handleBookmark}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this trend'}
        >
          {bookmarked ? (
            <BookmarkCheck size={17} className="text-primary" />
          ) : (
            <Bookmark size={17} className="text-foreground/50" />
          )}
        </button>
        <Link
          href={`/trend-detail?id=${trend.id}`}
          className="flex items-center gap-1.5 text-base font-bold text-primary hover:underline font-sans"
        >
          View Details
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}