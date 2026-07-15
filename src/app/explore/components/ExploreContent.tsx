'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import NemoScoreBadge from '@/components/ui/NemoScoreBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import TrendSparkline from '@/components/ui/TrendSparkline';
import { MOCK_TRENDS, TrendItem } from '@/lib/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformTab = 'all' | 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'google';
type SortOption = 'nemo-score' | 'rising-fastest' | 'most-recent' | 'most-searched';
type TimeFilter = '1h' | '6h' | '24h' | '7d';
type RegionFilter = 'global' | 'india' | 'usa' | 'uk';

interface NicheHeatTile {
  niche: string;
  count: number;
  heat: number; // 0–100
}

// ─── Mock Niche Heatmap Data ──────────────────────────────────────────────────

const NICHE_TILES: NicheHeatTile[] = [
  { niche: 'AI & Tech', count: 47, heat: 95 },
  { niche: 'Finance', count: 38, heat: 82 },
  { niche: 'Health', count: 31, heat: 74 },
  { niche: 'Fitness', count: 29, heat: 70 },
  { niche: 'Food', count: 26, heat: 65 },
  { niche: 'Travel', count: 22, heat: 58 },
  { niche: 'Fashion', count: 20, heat: 54 },
  { niche: 'Gaming', count: 18, heat: 50 },
  { niche: 'Education', count: 16, heat: 44 },
  { niche: 'Business', count: 14, heat: 40 },
  { niche: 'Music', count: 12, heat: 35 },
  { niche: 'Sports', count: 10, heat: 28 },
  { niche: 'Beauty', count: 9, heat: 24 },
  { niche: 'Crypto', count: 8, heat: 20 },
  { niche: 'Pets', count: 6, heat: 14 },
];

const RECENT_SEARCHES = [
  'AI automation tools',
  'viral reel hooks',
  'passive income 2025',
  'morning routine',
  'ChatGPT prompts',
];

const PLATFORM_TABS: { id: PlatformTab; label: string; icon: string; count: number }[] = [
  { id: 'all', label: 'All', icon: 'Squares2X2Icon', count: MOCK_TRENDS.length },
  { id: 'youtube', label: 'YouTube', icon: 'PlayCircleIcon', count: MOCK_TRENDS.filter(t => t.platforms.includes('youtube')).length },
  { id: 'instagram', label: 'Instagram', icon: 'CameraIcon', count: MOCK_TRENDS.filter(t => t.platforms.includes('instagram')).length },
  { id: 'tiktok', label: 'TikTok', icon: 'MusicalNoteIcon', count: MOCK_TRENDS.filter(t => t.platforms.includes('tiktok')).length },
  { id: 'linkedin', label: 'LinkedIn', icon: 'BriefcaseIcon', count: MOCK_TRENDS.filter(t => t.platforms.includes('linkedin')).length },
  { id: 'google', label: 'Google Trends', icon: 'MagnifyingGlassIcon', count: MOCK_TRENDS.filter(t => t.platforms.includes('google')).length },
];

// ─── Heat Color Helper ────────────────────────────────────────────────────────

function getHeatStyle(heat: number): { bg: string; text: string; border: string } {
  if (heat >= 85) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
  if (heat >= 70) return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
  if (heat >= 55) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
  if (heat >= 40) return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' };
  return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
}

function getTileSize(heat: number): string {
  if (heat >= 85) return 'col-span-2 row-span-2';
  if (heat >= 65) return 'col-span-2';
  return '';
}

// ─── Trend Card (Explore variant) ────────────────────────────────────────────

function ExploreTrendCard({ trend }: { trend: TrendItem }) {
  const [bookmarked, setBookmarked] = useState(trend.isBookmarked);

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-flame-sm transition-all duration-200 group cursor-pointer flex flex-col gap-3 trend-card-hover">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={trend.status} />
            <span className="text-xs text-muted-foreground font-mono-custom font-semibold">{trend.category}</span>
          </div>
          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 font-sans group-hover:text-primary transition-colors">
            {trend.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <NemoScoreBadge score={trend.nemoScore} size="sm" />
          <button
            onClick={(e) => { e.stopPropagation(); setBookmarked(v => !v); }}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            <Icon name={bookmarked ? 'BookmarkIcon' : 'BookmarkIcon'} size={15} variant={bookmarked ? 'solid' : 'outline'} className={bookmarked ? 'text-primary' : ''} />
          </button>
        </div>
      </div>

      {/* Sparkline */}
      <TrendSparkline data={trend.sparklineData} trend={trend.status === 'fading' ? 'down' : 'up'} height={36} width={160} />

      {/* Platforms */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {trend.platforms.slice(0, 4).map(p => (
          <PlatformBadge key={p} platform={p} size="xs" />
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono-custom border-t border-border pt-2.5">
        <span className="flex items-center gap-1 font-semibold">
          <Icon name="ArrowTrendingUpIcon" size={13} className="text-primary" />
          +{trend.velocity.toFixed(1)}x
        </span>
        <span className="font-semibold">{(trend.mentions24h / 1000).toFixed(0)}k mentions</span>
        <span>{trend.timeAgo}</span>
      </div>
    </div>
  );
}

// ─── Rising Fastest Card (horizontal scroll) ──────────────────────────────────

function RisingCard({ trend }: { trend: TrendItem }) {
  return (
    <div className="flex-shrink-0 w-60 bg-card border-2 border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-flame-sm transition-all duration-200 cursor-pointer group trend-card-hover">
      <div className="flex items-center justify-between mb-2.5">
        <StatusBadge status="RISING" />
        <NemoScoreBadge score={trend.nemoScore} size="sm" />
      </div>
      <p className="text-base font-bold text-foreground leading-snug line-clamp-2 font-sans mb-2.5 group-hover:text-primary transition-colors">
        {trend.title}
      </p>
      <TrendSparkline data={trend.sparklineData} trend={trend.status === 'fading' ? 'down' : 'up'} height={28} width={160} />
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {trend.platforms.slice(0, 3).map(p => (
          <PlatformBadge key={p} platform={p} size="xs" />
        ))}
      </div>
      <p className="text-sm font-mono-custom font-bold text-primary mt-2.5 flex items-center gap-1">
        <Icon name="BoltIcon" size={12} variant="solid" />
        +{trend.velocity.toFixed(1)}x velocity
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExploreContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [activeTab, setActiveTab] = useState<PlatformTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('nemo-score');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('global');
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter trends by platform tab
  const filteredByPlatform = MOCK_TRENDS.filter(t => {
    if (activeTab === 'all') return true;
    return t.platforms.includes(activeTab as any);
  });

  // Filter by niche
  const filteredByNiche = activeNiche
    ? filteredByPlatform.filter(t => t.category.toLowerCase().includes(activeNiche.toLowerCase()))
    : filteredByPlatform;

  // Filter by search
  const filteredTrends = searchQuery.trim()
    ? filteredByNiche.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.hashtags.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredByNiche;

  // Sort
  const sortedTrends = [...filteredTrends].sort((a, b) => {
    if (sortBy === 'nemo-score') return b.nemoScore - a.nemoScore;
    if (sortBy === 'rising-fastest') return b.velocity - a.velocity;
    if (sortBy === 'most-searched') return b.mentions24h - a.mentions24h;
    return 0; // most-recent: keep order
  });

  // Rising fastest (sorted by velocity, top 10)
  const risingFastest = [...MOCK_TRENDS]
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 10);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
  };

  const handleSearchSubmit = (q: string) => {
    if (q.trim() && !recentSearches.includes(q.trim())) {
      setRecentSearches(prev => [q.trim(), ...prev.slice(0, 4)]);
    }
    setShowRecentSearches(false);
  };

  // Close recent searches on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.closest('.search-wrapper')?.contains(e.target as Node)) {
        setShowRecentSearches(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-5 sm:px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
          <Icon name="MagnifyingGlassIcon" size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Explore</h1>
          <p className="text-sm text-muted-foreground font-sans mt-0.5">Discover trending topics across all platforms</p>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-6 max-w-screen-xl mx-auto space-y-8">

        {/* ── Full-Width Search Bar ── */}
        <div className="search-wrapper relative">
          <div className="relative">
            <Icon name="MagnifyingGlassIcon" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowRecentSearches(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(searchQuery); }}
              placeholder="Search trends, niches, hashtags…"
              className="w-full pl-12 pr-14 py-4 rounded-2xl bg-card border-2 border-border text-foreground placeholder:text-muted-foreground text-base font-sans font-medium focus:outline-none focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowRecentSearches(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="XMarkIcon" size={18} />
              </button>
            )}
          </div>

          {/* Recent Searches Dropdown */}
          {showRecentSearches && !searchQuery && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-2xl shadow-nav overflow-hidden z-50 animate-scale-in">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="font-mono-custom text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Searches</p>
              </div>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setSearchQuery(s); handleSearchSubmit(s); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
                >
                  <Icon name="ClockIcon" size={15} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-base font-sans font-medium text-foreground">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Niche Heatmap ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Niche Heatmap</h2>
              <p className="text-sm text-muted-foreground font-sans mt-0.5">Tile size = trend volume · Color = heat intensity</p>
            </div>
            {activeNiche && (
              <button
                onClick={() => setActiveNiche(null)}
                className="flex items-center gap-1.5 text-sm font-semibold font-sans text-primary hover:text-primary/80 transition-colors"
              >
                <Icon name="XMarkIcon" size={14} />
                Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 auto-rows-[60px] gap-2">
            {NICHE_TILES.map((tile) => {
              const { bg, text, border } = getHeatStyle(tile.heat);
              const span = getTileSize(tile.heat);
              const isActive = activeNiche === tile.niche;
              return (
                <button
                  key={tile.niche}
                  onClick={() => setActiveNiche(isActive ? null : tile.niche)}
                  title={`${tile.count} trending topics right now`}
                  className={`${span} ${bg} ${border} border-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:scale-[1.04] cursor-pointer ${
                    isActive ? 'ring-2 ring-primary scale-[1.04] shadow-flame-sm' : ''
                  }`}
                >
                  <span className={`text-xs font-bold font-sans leading-tight text-center px-1 ${text}`}>{tile.niche}</span>
                  <span className={`text-[11px] font-mono-custom font-semibold ${text} opacity-80`}>{tile.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Platform Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
          {PLATFORM_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold font-sans whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-flame-sm'
                  : 'bg-card border-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              <Icon name={tab.icon as any} size={16} />
              {tab.label}
              <span className={`text-xs font-mono-custom font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── ⚡ Rising Fastest ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
              <Icon name="BoltIcon" size={16} className="text-white" variant="solid" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">⚡ Rising Fastest</h2>
              <p className="text-sm text-muted-foreground font-sans">Highest velocity in the last 6 hours</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
            {risingFastest.map((trend) => (
              <RisingCard key={trend.id} trend={trend} />
            ))}
          </div>
        </div>

        {/* ── Sort & Filter Controls ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-card border-2 border-border rounded-xl px-3 py-2.5">
            <Icon name="ArrowsUpDownIcon" size={15} className="text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm font-bold font-sans text-foreground bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="nemo-score">Nemo Score</option>
              <option value="rising-fastest">Rising Fastest</option>
              <option value="most-recent">Most Recent</option>
              <option value="most-searched">Most Searched</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-card border-2 border-border rounded-xl p-1">
            {(['1h', '6h', '24h', '7d'] as TimeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono-custom font-bold transition-all ${
                  timeFilter === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-card border-2 border-border rounded-xl px-3 py-2.5">
            <Icon name="GlobeAltIcon" size={15} className="text-muted-foreground" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
              className="text-sm font-bold font-sans text-foreground bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="global">Global</option>
              <option value="india">India</option>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
            </select>
          </div>

          <span className="ml-auto text-sm font-mono-custom font-semibold text-muted-foreground">
            {sortedTrends.length} trends
          </span>
        </div>

        {/* ── Trend Grid ── */}
        {sortedTrends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedTrends.map((trend) => (
              <ExploreTrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <Icon name="MagnifyingGlassIcon" size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">No trends found</h3>
            <p className="text-base text-muted-foreground font-sans max-w-xs">
              Try changing your filters or search query to discover more trends.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveNiche(null); setActiveTab('all'); }}
              className="mt-5 btn-flame px-5 py-2.5 text-sm rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
