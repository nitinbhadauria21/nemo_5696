'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Bookmark } from 'lucide-react';
import { CATEGORIES, PLATFORMS } from '@/lib/mockData';
import type { TrendPlatform } from '@/lib/mockData';
import CountrySelector from '@/components/ui/CountrySelector';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { trackSearchQuery } from '@/lib/analytics/client';

export type DashboardFilterState = {
  categories: string[];
  platforms: TrendPlatform[];
  keyword: string;
  timeframe: string;
  bookmarksOnly: boolean;
  countries: string[];
  sortBy: 'score' | 'recent' | 'rising';
};

interface DashboardFiltersProps {
  /** Called only on Submit — drafts do not update the grid until then. */
  onFiltersChange?: (filters: DashboardFilterState) => void;
  /** Refetch /api/trends (does not apply draft filters). */
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TIMEFRAMES = ['24h', '48h', '72h'];
const SORT_OPTIONS = [
  { id: 'score', label: 'Nemo Score' },
  { id: 'recent', label: 'Most Recent' },
  { id: 'rising', label: 'Rising Fastest' },
] as const;

const PLATFORM_LABELS: Record<TrendPlatform, string> = {
  google: 'Google',
  youtube: 'YouTube',
  youtube_shorts: 'YT Shorts',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  reddit: 'Reddit',
  facebook: 'Facebook',
};

const DEFAULT_DRAFT: DashboardFilterState = {
  categories: ['All'],
  platforms: [],
  keyword: '',
  timeframe: '72h',
  bookmarksOnly: false,
  countries: [],
  sortBy: 'score',
};

export default function DashboardFilters({
  onFiltersChange,
  onRefresh,
  isRefreshing,
}: DashboardFiltersProps) {
  const [draft, setDraft] = useState<DashboardFilterState>(DEFAULT_DRAFT);
  const [applied, setApplied] = useState<DashboardFilterState>(DEFAULT_DRAFT);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, []);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(applied);

  const patchDraft = (overrides: Partial<DashboardFilterState>) => {
    setDraft((prev) => ({ ...prev, ...overrides }));
  };

  const handleSubmit = () => {
    setApplied(draft);
    onFiltersChange?.(draft);
    const kw = draft.keyword.trim();
    if (kw.length >= 2) {
      trackSearchQuery({
        query: kw,
        source: 'dashboard',
        filters: {
          categories: draft.categories,
          platforms: draft.platforms,
          timeframe: draft.timeframe,
          countries: draft.countries,
        },
      });
    }
  };

  const toggleCategory = (cat: string) => {
    let next: string[];
    if (cat === 'All') {
      next = ['All'];
    } else {
      const without = draft.categories.filter((c) => c !== 'All');
      if (without.includes(cat)) {
        next = without.filter((c) => c !== cat);
        if (next.length === 0) next = ['All'];
      } else {
        next = [...without, cat];
      }
    }
    patchDraft({ categories: next });
  };

  const togglePlatform = (p: TrendPlatform) => {
    const next = draft.platforms.includes(p)
      ? draft.platforms.filter((x) => x !== p)
      : [...draft.platforms, p];
    patchDraft({ platforms: next });
  };

  const allSourcesActive = draft.platforms.length === 0;

  return (
    <div className="card-surface flex flex-col divide-y divide-border">
      <div className="px-4 py-3">
        <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mb-2.5">
          Browse by Category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = draft.categories.includes(cat);
            return (
              <button
                key={`cat-${cat}`}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-sans font-semibold transition-all duration-150 border ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-transparent text-foreground/65 border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mb-2.5">
          Search Keywords
        </p>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
          />
          <input
            type="text"
            placeholder="Search title, description, hashtags… then Submit"
            value={draft.keyword}
            onChange={(e) => patchDraft({ keyword: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-base font-sans text-foreground placeholder:text-foreground/45 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold">
            Location:
          </p>
          <CountrySelector
            selectedCountries={draft.countries}
            onChange={(countries) => patchDraft({ countries })}
          />
          {draft.countries.length === 0 && (
            <span className="text-sm text-foreground/55 font-sans">
              Global (all regions) — select up to 4 countries to narrow
            </span>
          )}
          {draft.countries.length > 0 && (
            <span className="text-sm text-primary font-sans font-semibold">
              Draft: filter by selected {draft.countries.length === 1 ? 'country' : 'countries'}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mr-1">
            Source:
          </p>
          <button
            type="button"
            onClick={() => patchDraft({ platforms: [] })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-sans font-semibold border transition-all ${
              allSourcesActive
                ? 'bg-primary text-white border-primary'
                : 'bg-transparent text-foreground/65 border-border hover:text-foreground'
            }`}
          >
            All Sources
          </button>
          {PLATFORMS.map((p) => {
            const active = draft.platforms.includes(p);
            return (
              <button
                key={`plat-filter-${p}`}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'bg-transparent border-border text-foreground/65 hover:text-foreground'
                }`}
              >
                <PlatformIcon platform={p} size={14} withTile={false} />
                {PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mr-1">
            Sort:
          </p>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => patchDraft({ sortBy: opt.id })}
                className={`px-3 py-1.5 rounded-md text-sm font-sans font-semibold transition-all duration-150 ${
                  draft.sortBy === opt.id
                    ? 'bg-primary text-white'
                    : 'text-foreground/65 hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden sm:block w-px h-5 bg-border" />

        <div className="flex items-center gap-1.5">
          <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mr-1">
            Window:
          </p>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => patchDraft({ timeframe: tf })}
                className={`px-3 py-1.5 rounded-md text-sm font-sans font-semibold transition-all duration-150 ${
                  draft.timeframe === tf
                    ? 'bg-primary text-white'
                    : 'text-foreground/65 hover:text-foreground'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => patchDraft({ bookmarksOnly: !draft.bookmarksOnly })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-sans font-semibold transition-all duration-150 border ${
              draft.bookmarksOnly
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted text-foreground/65 border-border hover:text-foreground'
            }`}
          >
            <Bookmark size={14} />
            Saved Only
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Reload trends from API"
            aria-label="Reload trends from API"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-sans font-semibold bg-muted text-foreground/65 border border-border hover:text-foreground transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Reload data</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`btn-flame px-4 py-1.5 rounded-lg text-sm font-sans font-semibold ${
              isDirty ? 'ring-2 ring-primary/40' : ''
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
