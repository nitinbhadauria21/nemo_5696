'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Music2, ChevronRight } from 'lucide-react';
import type { TrendItem, TrendPlatform, TrendContentType } from '@/lib/mockData';
import PlatformIcon from '@/components/ui/PlatformIcon';

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
  google: 'text-blue-600 dark:text-blue-400',
  youtube: 'text-red-600 dark:text-red-400',
  instagram: 'text-pink-600 dark:text-pink-400',
  linkedin: 'text-sky-700 dark:text-sky-400',
  tiktok: 'text-cyan-700 dark:text-cyan-400',
  twitter: 'text-sky-600 dark:text-sky-400',
  reddit: 'text-orange-600 dark:text-orange-400',
};

const STATUS_CONFIG = {
  hot: {
    label: 'Hot',
    text: 'text-[#b33a00] dark:text-orange-300',
    bg: 'bg-primary/10 border-primary/20',
  },
  rising: {
    label: 'Rising',
    text: 'text-[#8a5a00] dark:text-amber-200',
    bg: 'bg-secondary/15 border-secondary/25',
  },
  fading: {
    label: 'Fading',
    text: 'text-muted-foreground',
    bg: 'bg-muted border-border',
  },
};

const CONTENT_TYPE_COLORS: Record<TrendContentType, string> = {
  TOPIC: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  HOOK: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  CONCEPT: 'bg-stone-500/10 text-stone-700 dark:text-stone-300',
  KEYWORD: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
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
    <article className="bg-card border border-border/80 rounded-2xl flex flex-col shadow-[0_1px_2px_rgba(15,10,5,0.04)] group hover:border-primary/35 hover:shadow-[0_10px_28px_rgba(15,10,5,0.08)] transition-all duration-200">
      <div className="px-4 pt-4 pb-3 border-b border-border/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <PlatformIcon platform={primaryPlatform} size={14} withTile={false} />
          <span
            className={`text-[0.8125rem] font-semibold tracking-[0.04em] uppercase truncate ${PLATFORM_COLORS[primaryPlatform]}`}
          >
            {PLATFORM_LABELS[primaryPlatform]}
          </span>
          <span className="text-foreground/30 text-sm" aria-hidden>
            ·
          </span>
          <span className="text-[0.8125rem] font-medium text-foreground/55 flex-shrink-0">
            {trend.timeAgo}
          </span>
        </div>
        <span
          className={`text-[0.75rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-1 rounded-full border flex-shrink-0 ${statusConfig.bg} ${statusConfig.text}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="px-4 py-3.5 flex-1 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[0.75rem] font-semibold tracking-[0.05em] uppercase px-2 py-0.5 rounded-md ${CONTENT_TYPE_COLORS[trend.contentType]}`}
          >
            {trend.contentType}
          </span>
          <span className="text-[0.875rem] text-foreground/65 font-medium">{trend.category}</span>
        </div>

        <h3 className="text-[1.05rem] font-semibold text-foreground leading-snug line-clamp-2 tracking-[-0.01em] group-hover:text-primary transition-colors">
          {trend.title}
        </h3>

        {trend.trendingAudio && (
          <div className="flex items-center gap-1.5 text-sm text-foreground/60">
            <Music2 size={13} className="text-primary flex-shrink-0" />
            <span className="truncate italic">{trend.trendingAudio}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-muted/40 border-t border-border/70 grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[0.6875rem] uppercase tracking-[0.08em] text-foreground/50 font-semibold">
            Velocity
          </span>
          <span className="text-[0.95rem] font-semibold text-foreground tabular-nums tracking-tight">
            {trend.velocity.toFixed(2)}x
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[0.6875rem] uppercase tracking-[0.08em] text-foreground/50 font-semibold">
            Spike
          </span>
          <span
            className={`text-[0.95rem] font-semibold tabular-nums tracking-tight ${spikePositive ? 'text-accent' : 'text-red-500'}`}
          >
            {spikePositive ? '+' : ''}
            {trend.spike}%
          </span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[0.6875rem] uppercase tracking-[0.08em] text-foreground/50 font-semibold">
            Score
          </span>
          <span
            className={`text-[1.15rem] font-bold tabular-nums tracking-tight ${getScoreColor(trend.nemoScore)}`}
          >
            {trend.nemoScore}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border/70 flex items-center justify-between">
        <button
          onClick={handleBookmark}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this trend'}
        >
          {bookmarked ? (
            <BookmarkCheck size={17} className="text-primary" />
          ) : (
            <Bookmark size={17} className="text-foreground/45" />
          )}
        </button>
        <Link
          href={`/trend/${trend.id}`}
          className="flex items-center gap-1 text-[0.9rem] font-semibold text-primary hover:opacity-90"
        >
          View details
          <ChevronRight size={15} />
        </Link>
      </div>
    </article>
  );
}
