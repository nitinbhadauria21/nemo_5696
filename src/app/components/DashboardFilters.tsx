'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Bookmark } from 'lucide-react';
import { CATEGORIES, PLATFORMS } from '@/lib/mockData';
import type { TrendPlatform } from '@/lib/mockData';
import CountrySelector from '@/components/ui/CountrySelector';

interface DashboardFiltersProps {
  onFiltersChange?: (filters: {
    categories: string[];
    platforms: TrendPlatform[];
    keyword: string;
    timeframe: string;
    bookmarksOnly: boolean;
    countries: string[];
  }) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TIMEFRAMES = ['24h', '48h', '72h'];

const PLATFORM_LABELS: Record<TrendPlatform, string> = {
  google: 'Google Trends',
  youtube: 'YouTube',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  reddit: 'Reddit',
};

export default function DashboardFilters({
  onFiltersChange,
  onRefresh,
  isRefreshing,
}: DashboardFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<TrendPlatform[]>([]);
  const [keyword, setKeyword] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const emitChange = (overrides: Partial<{
    categories: string[];
    platforms: TrendPlatform[];
    keyword: string;
    timeframe: string;
    bookmarksOnly: boolean;
    countries: string[];
  }> = {}) => {
    onFiltersChange?.({
      categories: selectedCategories,
      platforms: selectedPlatforms,
      keyword,
      timeframe,
      bookmarksOnly,
      countries: selectedCountries,
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

  const togglePlatform = (p: TrendPlatform) => {
    let next = selectedPlatforms.includes(p)
      ? selectedPlatforms.filter((x) => x !== p)
      : [...selectedPlatforms, p];
    setSelectedPlatforms(next);
    emitChange({ platforms: next });
  };

  const handleCountriesChange = (countries: string[]) => {
    setSelectedCountries(countries);
    emitChange({ countries });
  };

  const allSourcesActive = selectedPlatforms.length === 0;

  return (
    <div className="card-surface flex flex-col divide-y divide-border">
      {/* Row 1: Browse by category */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-mono-custom uppercase tracking-widest text-muted-foreground mb-2.5">
          Browse by Category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat);
            return (
              <button
                key={`cat-${cat}`}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all duration-150 border ${
                  active
                    ? 'bg-primary text-white border-primary' :'bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Search */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-mono-custom uppercase tracking-widest text-muted-foreground mb-2.5">
          Search Keywords
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search keywords in all niches… e.g. 'GPT-4', 'marathon', 'crypto'"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                emitChange({ keyword: e.target.value });
              }}
              className="w-full bg-input border border-border rounded-lg pl-8 pr-4 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="btn-flame px-4 py-2 text-sm rounded-lg">
            Search
          </button>
        </div>
      </div>

      {/* Row 3: Location filter */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[10px] font-mono-custom uppercase tracking-widest text-muted-foreground">
            Location:
          </p>
          <CountrySelector
            selectedCountries={selectedCountries}
            onChange={handleCountriesChange}
          />
          {selectedCountries.length === 0 && (
            <span className="text-[11px] text-muted-foreground font-sans">
              Select up to 4 countries to filter trends by region
            </span>
          )}
          {selectedCountries.length > 0 && (
            <span className="text-[11px] text-primary font-sans font-medium">
              Showing trends relevant to selected {selectedCountries.length === 1 ? 'country' : 'countries'}
            </span>
          )}
        </div>
      </div>

      {/* Row 4: Source filter + Time window + Bookmarks + Refresh */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Sources */}
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-mono-custom uppercase tracking-widest text-muted-foreground mr-1">
            Source:
          </p>
          <button
            onClick={() => {
              setSelectedPlatforms([]);
              emitChange({ platforms: [] });
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium border transition-all ${
              allSourcesActive
                ? 'bg-primary text-white border-primary' :'bg-transparent text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            All Sources
          </button>
          {PLATFORMS.map((p) => {
            const active = selectedPlatforms.includes(p);
            return (
              <button
                key={`plat-filter-${p}`}
                onClick={() => togglePlatform(p)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium border transition-all ${
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary' :'bg-transparent border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-border" />

        {/* Time window */}
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-mono-custom uppercase tracking-widest text-muted-foreground mr-1">
            Window:
          </p>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={`tf-${tf}`}
                onClick={() => {
                  setTimeframe(tf);
                  emitChange({ timeframe: tf });
                }}
                className={`px-3 py-1 rounded-md text-xs font-sans font-semibold transition-all duration-150 ${
                  timeframe === tf
                    ? 'bg-primary text-white' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-border" />

        {/* Bookmarks + Refresh */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => {
              let next = !bookmarksOnly;
              setBookmarksOnly(next);
              emitChange({ bookmarksOnly: next });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all duration-150 border ${
              bookmarksOnly
                ? 'bg-primary/10 text-primary border-primary/30' :'bg-muted text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Bookmark size={12} />
            Saved Only
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold bg-muted text-muted-foreground border border-border hover:text-foreground transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}