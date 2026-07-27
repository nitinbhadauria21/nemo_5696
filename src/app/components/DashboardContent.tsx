'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LiveBadge from './LiveBadge';
import DashboardKPICards from './DashboardKPICards';
import DashboardFilters from './DashboardFilters';
import DashboardSidebar from './DashboardSidebar';
import TrendCard from './TrendCard';
import { MOCK_TRENDS } from '@/lib/mockData';
import type { TrendItem, TrendPlatform } from '@/lib/mockData';
import { COUNTRIES } from '@/lib/countries';

export default function DashboardContent() {
  const [trends, setTrends] = useState<TrendItem[]>(MOCK_TRENDS);
  const [source, setSource] = useState<string>('mock');
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

  const loadTrends = async (refresh = false) => {
    try {
      const res = await fetch(`/api/trends${refresh ? '?refresh=1' : ''}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.trends) && data.trends.length) {
        setTrends(data.trends);
        setSource(data.source || 'api');
      }
    } catch {
      // keep current
    }
  };

  useEffect(() => {
    loadTrends(false);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrends(true);
    setIsRefreshing(false);
    toast.success('Trends refreshed', { icon: '🔥' });
  };

  const handleBookmarkToggle = (id: string) => {
    setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, isBookmarked: !t.isBookmarked } : t)));
    const trend = trends.find((t) => t.id === id);
    if (trend) {
      toast(trend.isBookmarked ? 'Bookmark removed' : 'Trend saved to bookmarks');
    }
  };

  const filteredTrends = trends.filter((t) => {
    if (activeFilters.bookmarksOnly && !t.isBookmarked) return false;
    if (!activeFilters.categories.includes('All') && !activeFilters.categories.includes(t.category)) return false;
    if (activeFilters.platforms.length > 0 && !activeFilters.platforms.some((p) => t.platforms.includes(p))) {
      return false;
    }
    if (
      activeFilters.keyword &&
      !t.title.toLowerCase().includes(activeFilters.keyword.toLowerCase()) &&
      !t.description.toLowerCase().includes(activeFilters.keyword.toLowerCase())
    ) {
      return false;
    }
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
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="min-w-0 overflow-hidden">
            <h1 className="font-display text-2xl font-bold text-foreground leading-tight truncate">
              Nemo Live Trend Report
            </h1>
            <p className="text-base text-foreground/65 font-sans truncate mt-0.5">
              Real-time trend intelligence · source: {source}
            </p>
          </div>
          <LiveBadge />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-flame px-5 py-2.5 whitespace-nowrap rounded-xl">+ Add to Queue</button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 max-w-screen-2xl mx-auto">
        <div className="flex gap-5">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <DashboardKPICards />
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display font-bold text-foreground text-xl">
                  {activeFilters.countries.length > 0 ? 'Filtered Trends' : 'All Trends'}{' '}
                  <span className="text-primary">{filteredTrends.length} detected</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-mono-custom font-bold uppercase tracking-wider">
                    {hotCount} Hot
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-mono-custom font-bold uppercase tracking-wider">
                    {risingCount} Rising
                  </span>
                </div>
              </div>
              <span className="text-base text-foreground/60 font-sans font-medium hidden sm:block">
                Sorted by NEMO Score
              </span>
            </div>

            {filteredTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="font-display font-bold text-foreground text-xl mb-2">No trends found</p>
                <p className="text-base text-foreground/65 font-sans">
                  Try selecting different countries or clear the location filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTrends.map((trend) => (
                  <TrendCard key={trend.id} trend={trend} onBookmarkToggle={handleBookmarkToggle} />
                ))}
              </div>
            )}
          </div>

          <div className="w-64 xl:w-72 flex-shrink-0 hidden lg:block">
            <DashboardSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
