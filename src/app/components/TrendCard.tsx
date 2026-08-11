'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Music2, ChevronRight, ExternalLink, Share2 } from 'lucide-react';
import type { TrendItem, TrendPlatform, TrendContentType } from '@/lib/mockData';
import PlatformIcon from '@/components/ui/PlatformIcon';
import TrendStatusBadge from './TrendStatusBadge';
import { VelocityIndicator, FreshnessIndicator, ConfidenceChip } from './TrendIndicators';

interface TrendCardProps {
  trend: TrendItem;
  onBookmarkToggle?: (id: string) => void;
}

const PLATFORM_LABELS: Record<TrendPlatform, string> = {
  google: 'Google',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  reddit: 'Reddit',
  facebook: 'Facebook',
};

const PLATFORM_COLORS: Record<TrendPlatform, string> = {
  google: 'text-blue-600 dark:text-blue-400',
  youtube: 'text-red-600 dark:text-red-400',
  youtube_shorts: 'text-red-600 dark:text-red-400',
  instagram: 'text-pink-600 dark:text-pink-400',
  linkedin: 'text-sky-700 dark:text-sky-400',
  tiktok: 'text-cyan-700 dark:text-cyan-400',
  twitter: 'text-sky-600 dark:text-sky-400',
  reddit: 'text-orange-600 dark:text-orange-400',
  facebook: 'text-blue-700 dark:text-blue-400',
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

function shortDate(iso?: string) {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrendCard({ trend, onBookmarkToggle }: TrendCardProps) {
  const [bookmarked, setBookmarked] = useState(trend.isBookmarked);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked((b) => !b);
    onBookmarkToggle?.(trend.id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/trend/${trend.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: trend.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore cancel
    }
  };

  const primaryPlatform = trend.platforms[0];
  const accel = trend.acceleration ?? 0;

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
        <TrendStatusBadge lifecycle={trend.lifecycle} fallback={trend.status} />
      </div>

      <div className="px-4 py-3.5 flex-1 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[0.75rem] font-semibold tracking-[0.05em] uppercase px-2 py-0.5 rounded-md ${CONTENT_TYPE_COLORS[trend.contentType]}`}
          >
            {trend.contentType}
          </span>
          <span className="text-[0.875rem] text-foreground/65 font-medium">{trend.category}</span>
          <ConfidenceChip level={trend.confidence} />
        </div>

        <h3 className="text-[1.05rem] font-semibold text-foreground leading-snug line-clamp-2 tracking-[-0.01em] group-hover:text-primary transition-colors">
          {trend.title}
        </h3>

        {trend.description && (
          <p className="text-sm text-foreground/60 line-clamp-2 leading-relaxed">
            {trend.description}
          </p>
        )}

        {trend.trendingAudio && (
          <div className="flex items-center gap-1.5 text-sm text-foreground/60">
            <Music2 size={13} className="text-primary flex-shrink-0" />
            <span className="truncate italic">{trend.trendingAudio}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {trend.platforms.slice(0, 5).map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[0.7rem] font-medium text-foreground/70"
            >
              <PlatformIcon platform={p} size={11} withTile={false} />
              {PLATFORM_LABELS[p]}
            </span>
          ))}
        </div>

        {(trend.clusterSize ?? 1) > 1 && (
          <p className="text-[0.75rem] text-foreground/55">
            Cluster · {trend.clusterSize} sources
            {trend.clusterAliases?.length
              ? ` · also: ${trend.clusterAliases.slice(0, 2).join(', ')}`
              : ''}
          </p>
        )}

        {trend.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trend.hashtags.slice(0, 4).map((h) => (
              <span key={h} className="text-[0.7rem] text-primary/80 font-medium">
                {h.startsWith('#') ? h : `#${h}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-muted/40 border-t border-border/70 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-foreground/50 font-semibold">
            Score
          </span>
          <span
            className={`text-[1.05rem] font-bold tabular-nums ${getScoreColor(trend.nemoScore)}`}
          >
            {Math.round(trend.nemoScore)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-foreground/50 font-semibold">
            Velocity
          </span>
          <VelocityIndicator value={trend.velocity} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-foreground/50 font-semibold">
            Accel
          </span>
          <span
            className={`text-sm font-semibold tabular-nums ${accel >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}
          >
            {accel >= 0 ? '+' : ''}
            {accel.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-foreground/50 font-semibold">
            Fresh
          </span>
          <FreshnessIndicator score={trend.freshness} />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border/60 grid grid-cols-2 gap-2 text-[0.75rem] text-foreground/60">
        <div>
          <span className="font-semibold text-foreground/50">Creators </span>
          {trend.creatorsCount.toLocaleString()}
        </div>
        <div>
          <span className="font-semibold text-foreground/50">Engagement </span>
          {(trend.engagementScore ?? trend.mentions24h).toLocaleString()}
        </div>
        <div>
          <span className="font-semibold text-foreground/50">First </span>
          {shortDate(trend.firstDetectedAt)}
        </div>
        <div>
          <span className="font-semibold text-foreground/50">Latest </span>
          {shortDate(trend.latestActivityAt || trend.firstDetectedAt)}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-1">
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
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Share trend"
          >
            <Share2 size={16} className="text-foreground/45" />
          </button>
          {trend.sourceUrl && (
            <a
              href={trend.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Open source"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} className="text-foreground/45" />
            </a>
          )}
        </div>
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
