'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import DashboardKPICards from './DashboardKPICards';
import DashboardFilters, { type DashboardFilterState } from './DashboardFilters';
import DashboardSidebar from './DashboardSidebar';
import TrendCard from './TrendCard';
import RealtimeStatus from './RealtimeStatus';
import DataSourceStatus from './DataSourceStatus';
import type { TrendItem } from '@/lib/mockData';
import { BRIEF_NICHES } from '@/lib/mockData';
import { COUNTRIES } from '@/lib/countries';
import { useAuth } from '@/context/AuthContext';
import { normalizeUiNiche } from '@/lib/trends/publicCopy';

/** Prefer real age from latest activity so 24h cards reflect what's hot now. */
function formatTimeAgo(
  firstDetectedAt: string,
  fallback: string,
  latestActivityAt?: string
): string {
  const detected = Date.parse(latestActivityAt || firstDetectedAt || '');
  if (!Number.isFinite(detected) || detected <= 0) return fallback || '—';
  const ageMs = Math.max(0, Date.now() - detected);
  const mins = Math.floor(ageMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function emptyStateCopy(filters: DashboardFilterState, opts: { rawCount: number }): string {
  const { rawCount } = opts;
  if (rawCount === 0) {
    return `No trends loaded yet. Use Refresh, or wait for the next ingest.`;
  }

  const parts: string[] = [];
  if (filters.platforms.length > 0) {
    parts.push(`sources: ${filters.platforms.join(', ')}`);
  }
  if (!filters.categories.includes('All')) {
    parts.push(`niches: ${filters.categories.join(', ')}`);
  }
  if (filters.countries.length > 0) {
    parts.push(`location: ${filters.countries.join(', ')}`);
  }
  if (filters.bookmarksOnly) {
    parts.push('saved only');
  }
  parts.push(`in last ${filters.timeframe}`);

  if (filters.countries.length > 0) {
    return `No trends match ${parts.join(' · ')}. Try clearing location or widening the window, then Submit.`;
  }
  if (!filters.categories.includes('All')) {
    return `No active trends for ${filters.categories.join(', ')} in the last ${filters.timeframe}. Try 48h / 72h or another niche.`;
  }
  if (filters.platforms.length > 0) {
    return `No trends match ${parts.join(' · ')}. Try All Sources or a wider window, then Submit.`;
  }
  return `No trends in the last ${filters.timeframe}. Refresh or widen the window (48h / 72h), then Submit.`;
}

function prefsToFilters(
  profile: {
    niches?: string[];
    platforms?: string[];
    default_time_window?: string | null;
    default_region?: string | null;
  } | null
): DashboardFilterState {
  const brief = new Set(BRIEF_NICHES as string[]);
  const niches = (profile?.niches || [])
    .map((n) => normalizeUiNiche(n))
    .filter((n) => brief.has(n));
  const platforms = (profile?.platforms || []) as DashboardFilterState['platforms'];
  const tf = profile?.default_time_window || '24h';
  const region = profile?.default_region;
  return {
    // Prefer All when multiple/stale niches would over-filter the feed
    categories: niches.length === 1 ? niches : ['All'],
    platforms: Array.isArray(platforms) ? platforms.filter(Boolean) : [],
    timeframe: tf === '48h' || tf === '72h' ? tf : '24h',
    bookmarksOnly: false,
    countries: region && region !== 'GLOBAL' ? [region] : [],
    sortBy: 'score',
  };
}

function buildQuery(filters: DashboardFilterState): string {
  const params = new URLSearchParams();
  if (!filters.categories.includes('All') && filters.categories.length) {
    params.set('niche', filters.categories.join(','));
  }
  if (filters.platforms.length) params.set('platforms', filters.platforms.join(','));
  if (filters.countries.length) params.set('geo', filters.countries.join(','));
  params.set('timeframe', filters.timeframe || '24h');
  params.set('sortBy', filters.sortBy);
  return params.toString();
}

export default function DashboardContent() {
  const { profile, user } = useAuth();
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [totalBeforeFilter, setTotalBeforeFilter] = useState(0);
  const [source, setSource] = useState<string>('loading');
  const [lastIngestAt, setLastIngestAt] = useState<string | null>(null);
  const [sourcesActive, setSourcesActive] = useState(0);
  const [sourcesUnavailable, setSourcesUnavailable] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);
  const [activeFilters, setActiveFilters] = useState<DashboardFilterState>({
    categories: ['All'],
    platforms: [],
    timeframe: '24h',
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

  useEffect(() => {
    if (prefsReady) return;
    if (profile) {
      setActiveFilters(prefsToFilters(profile as Parameters<typeof prefsToFilters>[0]));
      setPrefsReady(true);
    } else if (user === null || profile === null) {
      // Wait briefly for profile; fall through with 24h defaults
      const t = setTimeout(() => setPrefsReady(true), 400);
      return () => clearTimeout(t);
    }
  }, [profile, user, prefsReady]);

  const loadTrends = useCallback(
    async (refresh = false, filters = activeFilters) => {
      try {
        const qs = buildQuery(filters);
        const res = await fetch(`/api/trends?${qs}${refresh ? '&refresh=1' : ''}`);
        if (!res.ok) {
          setSource('error');
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.trends)) {
          setTrends(data.trends);
          setSource(data.source || 'api');
          setLastIngestAt(data.lastIngestAt || data.collectedAt || null);
          setTotalBeforeFilter(Number(data.totalBeforeFilter) || data.trends.length);
        }
      } catch {
        setSource('error');
      }
    },
    [activeFilters]
  );

  const loadSourceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/data-sources/status');
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data.sources) ? data.sources : [];
      setSourcesActive(
        list.filter((s: { status?: string }) => s.status === 'active' || s.status === 'live').length
      );
      setSourcesUnavailable(
        list.filter((s: { status?: string }) =>
          ['unavailable', 'error', 'disabled', 'estimated'].includes(String(s.status))
        ).length
      );
    } catch {
      // optional endpoint
    }
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    loadTrends(false, activeFilters);
    loadSourceStatus();
    const interval = setInterval(
      () => {
        loadTrends(true, activeFilters);
        loadSourceStatus();
      },
      10 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [prefsReady]); // eslint-disable-line react-hooks/exhaustive-deps

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
    await loadTrends(true, activeFilters);
    await loadSourceStatus();
    setIsRefreshing(false);
    toast.success('Trends refreshed');
  };

  const handleFiltersChange = async (filters: DashboardFilterState) => {
    setActiveFilters(filters);
    setIsRefreshing(true);
    await loadTrends(false, filters);
    setIsRefreshing(false);
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
        await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trendId: id }),
        }).catch(() => {});
      } else {
        await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
        await fetch(`/api/saved/${id}`, { method: 'DELETE' }).catch(() => {});
      }
      toast(next ? 'Trend saved' : 'Removed from saved');
    } catch {
      setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, isBookmarked: !next } : t)));
      toast.error('Could not update bookmark');
    }
  };

  // Client bookmarksOnly is the only client-side filter (server handles the rest).
  let displayTrends = activeFilters.bookmarksOnly ? trends.filter((t) => t.isBookmarked) : trends;

  displayTrends = displayTrends.map((t) => ({
    ...t,
    timeAgo: formatTimeAgo(t.firstDetectedAt, t.timeAgo, t.latestActivityAt),
  }));

  const fadingTrends = displayTrends.filter(
    (t) => t.lifecycle === 'fading' || (!t.lifecycle && t.status === 'fading')
  );
  const primaryTrends = displayTrends.filter(
    (t) => t.lifecycle !== 'fading' && t.lifecycle !== 'recycled' && t.status !== 'fading'
  );
  const featuredTrends = primaryTrends.filter((t) => t.nemoScore >= 70).slice(0, 3);
  const emergingCount = primaryTrends.filter(
    (t) => t.lifecycle === 'emerging' || t.lifecycle === 'breakout' || t.status === 'hot'
  ).length;
  const risingCount = primaryTrends.filter(
    (t) => t.lifecycle === 'rising' || t.status === 'rising'
  ).length;

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
          <img
            src="/brand/nemo-detective.png"
            alt=""
            width={56}
            height={56}
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain flex-shrink-0 drop-shadow-sm"
            decoding="async"
          />
          <div className="min-w-0 overflow-hidden">
            <h1 className="font-display text-2xl font-bold text-foreground leading-tight truncate">
              Hey {displayName.split(' ')[0]} — Live trends
            </h1>
            <p className="text-base text-foreground/65 font-sans truncate mt-0.5">
              {planLabel} plan · Near real-time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" className="btn-flame px-5 py-2.5 whitespace-nowrap rounded-xl">
            + Add to Queue
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 max-w-screen-2xl mx-auto">
        <div className="flex gap-5">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <RealtimeStatus
              lastIngestAt={lastIngestAt}
              trendCount={displayTrends.length}
              sourcesActive={sourcesActive}
              sourcesUnavailable={sourcesUnavailable}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              sourceLabel={source}
            />
            <DataSourceStatus compact />
            <DashboardKPICards trends={primaryTrends.length ? primaryTrends : displayTrends} />
            <DashboardFilters
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onFiltersChange={handleFiltersChange}
              initialFilters={activeFilters}
            />

            {selectedCountryNames.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20 text-base font-sans">
                <span className="text-primary font-bold">Location filter active:</span>
                <span className="text-foreground font-medium">
                  {selectedCountryNames.map((c) => `${c!.flag} ${c!.name}`).join(' · ')}
                </span>
              </div>
            )}

            {featuredTrends.length > 0 && (
              <div>
                <h2 className="font-semibold tracking-tight text-lg mb-3 text-foreground">
                  Top Featured Trends
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
                  !activeFilters.categories.includes('All')
                    ? 'Filtered Trends'
                    : 'Active Trends'}{' '}
                  <span className="text-primary font-semibold">
                    {primaryTrends.length} detected
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[0.75rem] font-semibold uppercase tracking-[0.06em]">
                    {emergingCount} Emerging/Hot
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-800 dark:text-blue-300 text-[0.75rem] font-semibold uppercase tracking-[0.06em]">
                    {risingCount} Rising
                  </span>
                </div>
              </div>
              <span className="text-base text-foreground/60 font-sans font-medium hidden sm:block">
                Sorted by {sortLabel} · In last {activeFilters.timeframe}
              </span>
            </div>

            {displayTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="font-display font-bold text-foreground text-xl mb-2">
                  No trends found
                </p>
                <p className="text-base text-foreground/65 font-sans max-w-lg">
                  {emptyStateCopy(activeFilters, { rawCount: totalBeforeFilter })}
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                data-testid="dashboard-trend-grid"
              >
                {(primaryTrends.length ? primaryTrends : displayTrends).map((trend) => (
                  <TrendCard key={trend.id} trend={trend} onBookmarkToggle={handleBookmarkToggle} />
                ))}
              </div>
            )}

            {fadingTrends.length > 0 && (
              <div className="mt-4">
                <h2 className="font-semibold tracking-tight text-foreground text-lg mb-3">
                  Fading{' '}
                  <span className="text-foreground/50 font-medium">{fadingTrends.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 opacity-90">
                  {fadingTrends.map((trend) => (
                    <TrendCard
                      key={`fading-${trend.id}`}
                      trend={trend}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-64 xl:w-72 flex-shrink-0 hidden lg:block">
            <DashboardSidebar trends={primaryTrends.length ? primaryTrends : displayTrends} />
          </div>
        </div>
      </div>
    </div>
  );
}
