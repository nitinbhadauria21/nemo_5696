'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Bookmark } from 'lucide-react';
import { CATEGORIES } from '@/lib/mockData';
import type { TrendPlatform } from '@/lib/mockData';
import CountrySelector from '@/components/ui/CountrySelector';
import { trackSearchQuery } from '@/lib/analytics/client';

interface DashboardFiltersProps {
  onFiltersChange?: (filters: {
    categories: string[];
    platforms: TrendPlatform[];
    keyword: string;
    timeframe: string;
    bookmarksOnly: boolean;
    countries: string[];
    sortBy: 'score' | 'recent' | 'rising';
  }) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TIMEFRAMES = ['24h', '48h', '72h'];
const SORT_OPTIONS = [
  { id: 'score', label: 'Nemo Score' },
  { id: 'recent', label: 'Most Recent' },
  { id: 'rising', label: 'Rising Fastest' },
] as const;

export default function DashboardFilters({
  onFiltersChange,
  onRefresh,
  isRefreshing,
}: DashboardFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [keyword, setKeyword] = useState('');
  const [timeframe, setTimeframe] = useState('72h');
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'rising'>('score');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, []);

  const emitChange = (
    overrides: Partial<{
      categories: string[];
      platforms: TrendPlatform[];
      keyword: string;
      timeframe: string;
      bookmarksOnly: boolean;
      countries: string[];
      sortBy: 'score' | 'recent' | 'rising';
    }> = {}
  ) => {
    onFiltersChange?.({
      categories: selectedCategories,
      platforms: [],
      keyword,
      timeframe,
      bookmarksOnly,
      countries: selectedCountries,
      sortBy,
      ...overrides,
    });
  };

  const toggleCategory = (cat: string) => {
    let next: string[];
    if (cat === 'All') {
      next = ['All'];
    } else {
      const without = selectedCategories.filter((c) => c !== 'All');
      if (without.includes(cat)) {
        next = without.filter((c) => c !== cat);
        if (next.length === 0) next = ['All'];
      } else {
        next = [...without, cat];
      }
    }
    setSelectedCategories(next);
    emitChange({ categories: next });
  };

  const handleCountriesChange = (countries: string[]) => {
    setSelectedCountries(countries);
    emitChange({ countries });
  };

  return (
    <div className="card-surface flex flex-col divide-y divide-border">
      <div className="px-4 py-3">
        <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold mb-2.5">
          Browse by Category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat);
            return (
              <button
                key={`cat-${cat}`}
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
            />
            <input
              type="text"
              placeholder="Search keywords in all niches… e.g. 'GPT-4', 'marathon', 'crypto'"
              value={keyword}
              onChange={(e) => {
                const value = e.target.value;
                setKeyword(value);
                emitChange({ keyword: value });
                if (searchDebounce.current) clearTimeout(searchDebounce.current);
                searchDebounce.current = setTimeout(() => {
                  if (value.trim().length >= 2) {
                    trackSearchQuery({
                      query: value,
                      source: 'dashboard',
                      filters: {
                        categories: selectedCategories,
                        platforms: [],
                        timeframe,
                        countries: selectedCountries,
                      },
                    });
                  }
                }, 600);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keyword.trim().length >= 2) {
                  trackSearchQuery({
                    query: keyword,
                    source: 'dashboard',
                    filters: {
                      categories: selectedCategories,
                      platforms: [],
                      timeframe,
                      countries: selectedCountries,
                    },
                  });
                }
              }}
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-base font-sans text-foreground placeholder:text-foreground/45 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            className="btn-flame px-4 py-2 rounded-lg"
            onClick={() => {
              if (keyword.trim().length >= 2) {
                trackSearchQuery({
                  query: keyword,
                  source: 'dashboard',
                  filters: {
                    categories: selectedCategories,
                    platforms: [],
                    timeframe,
                    countries: selectedCountries,
                  },
                });
              }
            }}
          >
            Search
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold">
            Location:
          </p>
          <CountrySelector selectedCountries={selectedCountries} onChange={handleCountriesChange} />
          {selectedCountries.length === 0 && (
            <span className="text-sm text-foreground/55 font-sans">
              Global (all regions) — select up to 4 countries to narrow
            </span>
          )}
          {selectedCountries.length > 0 && (
            <span className="text-sm text-primary font-sans font-semibold">
              Showing trends relevant to selected{' '}
              {selectedCountries.length === 1 ? 'country' : 'countries'}
            </span>
          )}
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
                onClick={() => {
                  setSortBy(opt.id);
                  emitChange({ sortBy: opt.id });
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-sans font-semibold transition-all duration-150 ${
                  sortBy === opt.id
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
                onClick={() => {
                  setTimeframe(tf);
                  emitChange({ timeframe: tf });
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-sans font-semibold transition-all duration-150 ${
                  timeframe === tf
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
            onClick={() => {
              const next = !bookmarksOnly;
              setBookmarksOnly(next);
              emitChange({ bookmarksOnly: next });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-sans font-semibold transition-all duration-150 border ${
              bookmarksOnly
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted text-foreground/65 border-border hover:text-foreground'
            }`}
          >
            <Bookmark size={14} />
            Saved Only
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-sans font-semibold bg-muted text-foreground/65 border border-border hover:text-foreground transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
