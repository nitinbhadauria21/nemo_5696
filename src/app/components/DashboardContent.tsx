'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LiveBadge from './LiveBadge';
import DashboardKPICards from './DashboardKPICards';
import DashboardFilters, { type DashboardFilterState } from './DashboardFilters';
import DashboardSidebar from './DashboardSidebar';
import TrendCard from './TrendCard';
import type { TrendItem } from '@/lib/mockData';
import { COUNTRIES } from '@/lib/countries';
import { useAuth } from '@/context/AuthContext';

/** Prefer real age from firstDetectedAt so cards aren't stuck on collector stub "1h/2h/3h". */
function formatTimeAgo(firstDetectedAt: string, fallback: string): string {
  const detected = Date.parse(firstDetectedAt || '');
  if (!Number.isFinite(detected) || detected <= 0) return fallback || '—';
  const ageMs = Math.max(0, Date.now() - detected);
  const mins = Math.floor(ageMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function emptyStateCopy(filters: DashboardFilterState): string {
  const parts: string[] = [];
  if (filters.platforms.length > 0) {
    parts.push(`sources: ${filters.platforms.join(', ')}`);
  }
  if (!filters.categories.includes('All')) {
    parts.push(`categories: ${filters.categories.join(', ')}`);
  }
  if (filters.keyword.trim()) {
    parts.push(`keyword “${filters.keyword.trim()}”`);
  }
  if (filters.countries.length > 0) {
    parts.push(`location: ${filters.countries.join(', ')}`);
  }
  if (filters.bookmarksOnly) {
    parts.push('saved only');
  }
  parts.push(`window ${filters.timeframe}`);

  if (filters.countries.length > 0) {
    return `No trends match ${parts.join(' · ')}. Try clearing location or widening the window.`;
  }
  if (filters.keyword.trim()) {
    return `No trends match ${parts.join(' · ')}. Try a different keyword or clear search, then Submit.`;
  }
  if (filters.platforms.length > 0) {
    return `No trends match ${parts.join(' · ')}. Try All Sources or a wider window, then Submit.`;
  }
  return `No trends in the last ${filters.timeframe}. Reload data or widen the window (48h / 72h), then Submit.`;
}

export default function DashboardContent() {
  const { profile, user } = useAuth();
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [source, setSource] = useState<string>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<DashboardFilterState>({
    categories: ['All'],
    platforms: [],
    keyword: '',
    timeframe: '72h',
    bookmarksOnly: false,
    countries: [],
    sortBy: 'score',
  });

  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    profile?.email ||
    user?.email ||
    'Creator';
  const planLabel =
    profile?.plan === 'agency' ? 'Agency' : profile?.plan === 'pro' ? 'Pro' : 'Free';

  const loadTrends = async (refresh = false) => {
    try {
      const res = await fetch(`/api/trends${refresh ? '?refresh=1' : ''}`);
      if (!res.ok) {
        setSource('error');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.trends)) {
        setTrends(data.trends);
        setSource(data.source || 'api');
      }
    } catch {
      setSource('error');
    }
  };

  useEffect(() => {
    loadTrends(false);
    const interval = setInterval(() => loadTrends(true), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.bookmarks)) return;
        const ids = new Set(data.bookmarks as string[]);
        setTrends((prev) => prev.map((t) => ({ ...t, isBookmarked: ids.has(t.id) })));
      })
      .catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrends(true);
    setIsRefreshing(false);
    toast.success('Trends reloaded from API');
  };

  const handleBookmarkToggle = async (id: string) => {
    const trend = trends.find((t) => t.id === id);
    if (!trend) return;
    const next = !trend.isBookmarked;
    setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, isBookmarked: next } : t)));
    try {
      if (next) {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trendId: id }),
        });
      } else {
        await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
      }
      toast(next ? 'Trend saved to bookmarks' : 'Bookmark removed');
    } catch {
      setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, isBookmarked: !next } : t)));
      toast.error('Could not update bookmark');
    }
  };

  const timeframeHours =
    activeFilters.timeframe === '48h' ? 48 : activeFilters.timeframe === '72h' ? 72 : 24;

  const filteredTrends = trends.filter((t) => {
    if (activeFilters.bookmarksOnly && !t.isBookmarked) return false;
    if (!activeFilters.categories.includes('All') && !activeFilters.categories.includes(t.category))
      return false;
    if (
      activeFilters.platforms.length > 0 &&
      !activeFilters.platforms.some((p) => t.platforms.includes(p))
    ) {
      return false;
    }
    const kw = activeFilters.keyword.trim().toLowerCase();
    if (kw) {
      const inTitle = t.title.toLowerCase().includes(kw);
      const inDesc = (t.description || '').toLowerCase().includes(kw);
      const inTags = (t.hashtags || []).some((h) => h.toLowerCase().includes(kw));
      if (!inTitle && !inDesc && !inTags) return false;
    }
    // Empty countries = Global: show all (including untagged geoRegions).
    // When countries are selected: keep matching geo OR untagged rows so the grid
    // doesn't go blank until collectors stamp geo on every trend.
    if (activeFilters.countries.length > 0) {
      const trendRegions = t.geoRegions ?? [];
      if (trendRegions.length > 0) {
        const hasMatch = activeFilters.countries.some(
          (code) =>
            trendRegions.includes(code) ||
            (code === 'GB' && trendRegions.includes('UK')) ||
            (code === 'UK' && trendRegions.includes('GB'))
        );
        if (!hasMatch) return false;
      }
    }
    const detected = Date.parse(t.firstDetectedAt || '');
    if (Number.isFinite(detected) && detected > 0) {
      const ageMs = Date.now() - detected;
      if (ageMs > timeframeHours * 3600 * 1000) return false;
    }
    return true;
  });

  const sortedTrends = [...filteredTrends]
    .map((t) => ({
      ...t,
      timeAgo: formatTimeAgo(t.firstDetectedAt, t.timeAgo),
    }))
    .sort((a, b) => {
      if (activeFilters.sortBy === 'rising') return b.velocity - a.velocity;
      if (activeFilters.sortBy === 'recent') {
        return new Date(b.firstDetectedAt).getTime() - new Date(a.firstDetectedAt).getTime();
      }
      return b.nemoScore - a.nemoScore;
    });

  // Main grid shows ALL filtered trends (including lower scores). Hiding "fading"
  // previously caused "16 detected" + empty grid when scores were under 50.
  const featuredTrends = sortedTrends.filter((t) => t.nemoScore >= 70).slice(0, 3);
  const displayTrends = sortedTrends;
  const hotCount = displayTrends.filter((t) => t.status === 'hot').length;
  const risingCount = displayTrends.filter((t) => t.status === 'rising').length;

  const sortLabel =
    activeFilters.sortBy === 'rising'
      ? 'Rising Fastest'
      : activeFilters.sortBy === 'recent'
        ? 'Most Recent'
        : 'Nemo Score';

  const selectedCountryNames = activeFilters.countries
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="min-w-0 overflow-hidden">
            <h1 className="font-display text-2xl font-bold text-foreground leading-tight truncate">
              Hey {displayName.split(' ')[0]} — Live trends
            </h1>
            <p className="text-base text-foreground/65 font-sans truncate mt-0.5">
              {planLabel} plan · source: {source}
            </p>
          </div>
          <LiveBadge />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-flame px-5 py-2.5 whitespace-nowrap rounded-xl">
            + Add to Queue
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 max-w-screen-2xl mx-auto">
        <div className="flex gap-5">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <DashboardKPICards trends={trends} />
            <DashboardFilters
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onFiltersChange={setActiveFilters}
            />

            {selectedCountryNames.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20 text-base font-sans">
                <span className="text-primary font-bold">Location filter active:</span>
                <span className="text-foreground font-medium">
                  {selectedCountryNames.map((c) => `${c!.flag} ${c!.name}`).join(' · ')}
                </span>
              </div>
            )}

            <div className="rounded-2xl border-2 border-primary/25 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-primary">
                  Daily digest
                </p>
                <p className="text-sm text-foreground font-sans mt-1 leading-relaxed">
                  {hotCount + risingCount} trends need your attention today —{' '}
                  {featuredTrends[0]?.title ?? 'refresh for latest picks'} leads the pack.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="text-sm font-semibold text-primary hover:underline self-start sm:self-center"
              >
                Reload digest →
              </button>
            </div>

            {featuredTrends.length > 0 && (
              <div>
                <h2 className="font-semibold tracking-tight text-lg mb-3 text-foreground">
                  Top 3 Featured Trends
                </h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {featuredTrends.map((trend) => (
                    <TrendCard
                      key={`featured-${trend.id}`}
                      trend={trend}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-semibold tracking-tight text-foreground text-xl">
                  {activeFilters.countries.length > 0 ||
                  activeFilters.platforms.length > 0 ||
                  activeFilters.keyword ||
                  !activeFilters.categories.includes('All')
                    ? 'Filtered Trends'
                    : 'All Trends'}{' '}
                  <span className="text-primary font-semibold">
                    {filteredTrends.length} detected
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[0.75rem] font-semibold uppercase tracking-[0.06em]">
                    {hotCount} Hot
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 text-[#8a5a00] dark:text-amber-200 text-[0.75rem] font-semibold uppercase tracking-[0.06em]">
                    {risingCount} Rising
                  </span>
                </div>
              </div>
              <span className="text-base text-foreground/60 font-sans font-medium hidden sm:block">
                Sorted by {sortLabel} · {activeFilters.timeframe}
              </span>
            </div>

            {displayTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="font-display font-bold text-foreground text-xl mb-2">
                  No trends found
                </p>
                <p className="text-base text-foreground/65 font-sans max-w-lg">
                  {emptyStateCopy(activeFilters)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayTrends.map((trend) => (
                  <TrendCard key={trend.id} trend={trend} onBookmarkToggle={handleBookmarkToggle} />
                ))}
              </div>
            )}
          </div>

          <div className="w-64 xl:w-72 flex-shrink-0 hidden lg:block">
            <DashboardSidebar trends={trends} />
          </div>
        </div>
      </div>
    </div>
  );
}
