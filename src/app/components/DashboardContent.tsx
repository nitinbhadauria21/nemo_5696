'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import LiveBadge from './LiveBadge';
import DashboardKPICards from './DashboardKPICards';
import DashboardFilters from './DashboardFilters';
import DashboardSidebar from './DashboardSidebar';
import TrendCard from './TrendCard';
import { MOCK_TRENDS } from '@/lib/mockData';
import type { TrendPlatform } from '@/lib/mockData';
import { COUNTRIES } from '@/lib/countries';

export default function DashboardContent() {
  const [trends, setTrends] = useState(MOCK_TRENDS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    platforms: TrendPlatform[];
    keyword: string;
    timeframe: string;
    bookmarksOnly: boolean;
    countries: string[];
  }>({
    categories: ['All'],
    platforms: [],
    keyword: '',
    timeframe: '24h',
    bookmarksOnly: false,
    countries: [],
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Trends refreshed — 2,847 trends tracked', {
        icon: '🔥',
      });
    }, 1400);
  };

  const handleBookmarkToggle = (id: string) => {
    setTrends((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isBookmarked: !t.isBookmarked } : t))
    );
    const trend = trends.find((t) => t.id === id);
    if (trend) {
      toast(trend.isBookmarked ? 'Bookmark removed' : 'Trend saved to bookmarks', {
        icon: trend.isBookmarked ? '🗑️' : '🔖',
      });
    }
  };

  const filteredTrends = trends.filter((t) => {
    if (activeFilters.bookmarksOnly && !t.isBookmarked) return false;
    if (!activeFilters.categories.includes('All') && !activeFilters.categories.includes(t.category)) return false;
    if (activeFilters.platforms.length > 0 && !activeFilters.platforms.some((p) => t.platforms.includes(p))) return false;
    if (activeFilters.keyword && !t.title.toLowerCase().includes(activeFilters.keyword.toLowerCase()) && !t.description.toLowerCase().includes(activeFilters.keyword.toLowerCase())) return false;
    // Country filter: if countries selected, only show trends that have geoRegions matching any selected country
    if (activeFilters.countries.length > 0) {
      const trendRegions = t.geoRegions ?? [];
      const hasMatch = activeFilters.countries.some((code) => trendRegions.includes(code));
      if (!hasMatch) return false;
    }
    return true;
  });

  const hotCount = filteredTrends.filter((t) => t.status === 'hot').length;
  const risingCount = filteredTrends.filter((t) => t.status === 'rising').length;

  const selectedCountryNames = activeFilters.countries
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
          <div className="min-w-0 overflow-hidden">
            <h1 className="font-display text-base sm:text-xl font-bold text-foreground leading-tight truncate">
              Nemo Live Trend Report
            </h1>
            <p className="text-xs text-muted-foreground font-sans truncate">
              Jul 14, 2026 · Real-time trend intelligence
            </p>
          </div>
          <LiveBadge />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-flame px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
            + Add to Queue
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="px-3 sm:px-6 py-5 max-w-screen-2xl mx-auto">
        <div className="flex gap-5">
          {/* Left: main feed */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* KPI Stats Bar */}
            <DashboardKPICards />

            {/* Filters */}
            <DashboardFilters
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onFiltersChange={setActiveFilters}
            />

            {/* Active country filter banner */}
            {selectedCountryNames.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-sans">
                <span className="text-primary font-semibold">📍 Location filter active:</span>
                <span className="text-foreground">
                  {selectedCountryNames.map((c) => `${c!.flag} ${c!.name}`).join(' · ')}
                </span>
              </div>
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-sans font-bold text-foreground text-base">
                  {activeFilters.countries.length > 0 ? 'Filtered Trends' : 'All Trends'} —{' '}
                  <span className="text-primary">{filteredTrends.length} detected</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono-custom font-bold uppercase tracking-widest">
                    🔥 {hotCount} Hot
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-mono-custom font-bold uppercase tracking-widest">
                    📈 {risingCount} Rising
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-sans">
                Sorted by NEMO Score
              </span>
            </div>

            {/* Trend Grid */}
            {filteredTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">🌍</span>
                <p className="font-sans font-semibold text-foreground text-base mb-1">No trends found for selected countries</p>
                <p className="text-sm text-muted-foreground font-sans">
                  Try selecting different countries or clear the location filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredTrends.map((trend) => (
                  <TrendCard
                    key={trend.id}
                    trend={trend}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-64 xl:w-72 flex-shrink-0 hidden lg:block">
            <DashboardSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}