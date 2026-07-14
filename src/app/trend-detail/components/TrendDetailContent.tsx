'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, Plus, Copy, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import TrendSparkline from '@/components/ui/TrendSparkline';
import ScoreBreakdownPanel from './ScoreBreakdownPanel';
import AIAnalysisSection from './AIAnalysisSection';
import RealTimeTrendingPosts from './RealTimeTrendingPosts';
import CountrySelector from '@/components/ui/CountrySelector';
import { COUNTRIES } from '@/lib/countries';

const TREND = {
  id: 'trend-001',
  title: 'Claude AI Tool Integrations',
  category: 'AI & Tech',
  status: 'hot' as const,
  nemoScore: 91,
  cvs: 0.88,
  ss: 4.2,
  cps: 0.80,
  freshness: 1.0,
  platforms: ['google', 'youtube', 'linkedin'] as const,
  creatorsCount: 4821,
  mentions24h: 128400,
  sparklineData: [20, 35, 28, 52, 48, 71, 88, 95, 91],
  timeAgo: '2h ago',
  hashtags: ['#ClaudeAI', '#AITools', '#MCP', '#Automation', '#LLM', '#AIAgents', '#ContentAI', '#BuildWithClaude'],
  description: 'Claude AI tool integrations and MCP server configurations are exploding across developer and creator communities as Anthropic releases new tool-use capabilities.',
};

const PLATFORM_SIGNALS = [
  { id: 'sig-google', platform: 'google' as const, label: 'Google Trends', score: 89, volume: '128K searches', delta: '+312%' },
  { id: 'sig-youtube', platform: 'youtube' as const, label: 'YouTube Shorts', score: 84, volume: '2,847 videos', delta: '+188%' },
  { id: 'sig-linkedin', platform: 'linkedin' as const, label: 'LinkedIn', score: 71, volume: '4,102 posts', delta: '+94%' },
];

export default function TrendDetailContent() {
  const [bookmarked, setBookmarked] = useState(true);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const copyAllHashtags = () => {
    navigator.clipboard.writeText(TREND.hashtags.join(' ')).then(() => {
      setCopiedHashtags(true);
      toast.success('Hashtags copied to clipboard');
      setTimeout(() => setCopiedHashtags(false), 2000);
    });
  };

  const selectedCountryNames = selectedCountries
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-6 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans flex-shrink-0"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <div className="w-px h-4 bg-border" />
            <StatusBadge status={TREND.status} size="sm" />
            <span className="text-xs text-muted-foreground font-sans hidden sm:block">{TREND.category}</span>
            <h1 className="font-display text-lg font-bold text-foreground truncate hidden md:block">
              {TREND.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Country selector in trend detail header */}
            <CountrySelector
              selectedCountries={selectedCountries}
              onChange={setSelectedCountries}
              compact
            />
            <button
              onClick={() => {
                setBookmarked((b) => !b);
                toast(bookmarked ? 'Bookmark removed' : 'Trend saved');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card text-sm font-sans font-medium hover:bg-muted transition-all"
            >
              {bookmarked ? <BookmarkCheck size={14} className="text-primary" /> : <Bookmark size={14} />}
              {bookmarked ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => toast('Share link copied!')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card text-sm font-sans font-medium hover:bg-muted transition-all"
            >
              <Share2 size={14} />
              Share
            </button>
            <button className="btn-flame flex items-center gap-1.5 px-4 py-2 text-sm">
              <Plus size={14} />
              Add to Queue
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
        {/* Active country filter banner */}
        {selectedCountryNames.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-sans mb-5">
            <span className="text-primary font-semibold">📍 Viewing trend data for:</span>
            <span className="text-foreground">
              {selectedCountryNames.map((c) => `${c!.flag} ${c!.name}`).join(' · ')}
            </span>
          </div>
        )}
        {/* Live Trending Posts — shown on mobile/tablet above main content */}
        <div className="xl:hidden mb-5">
          <RealTimeTrendingPosts />
        </div>

        <div className="flex gap-6">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Title block */}
            <div className="card-surface p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    {TREND.title}
                  </h2>
                  <p className="text-sm font-sans text-muted-foreground leading-relaxed mb-4">
                    {TREND.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TREND.platforms.map((p) => (
                      <PlatformBadge key={`detail-plat-${p}`} platform={p} size="md" />
                    ))}
                    <span className="text-xs font-sans text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
                      {TREND.creatorsCount.toLocaleString()} creators
                    </span>
                    <span className="text-xs font-sans text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
                      {TREND.mentions24h.toLocaleString()} mentions 24h
                    </span>
                    <span className="text-xs font-sans text-muted-foreground px-2.5 py-1 bg-muted rounded-full">
                      {TREND.timeAgo}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <TrendSparkline data={TREND.sparklineData} width={100} height={40} trend="up" />
                  <span className="text-xs font-mono-custom text-muted-foreground">7-day signal</span>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <ScoreBreakdownPanel finalScore={TREND.nemoScore} />

            {/* AI Sections */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                AI-Powered Analysis
              </h3>
              <AIAnalysisSection type="analysis" trendTitle={TREND.title} />
              <AIAnalysisSection type="sentiment" trendTitle={TREND.title} />
              <AIAnalysisSection type="ideas" trendTitle={TREND.title} />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-64 xl:w-72 flex-shrink-0 hidden lg:flex flex-col gap-4">
            {/* Platform signals */}
            <div className="card-surface p-4">
              <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3">
                Platform Signals
              </h3>
              <div className="space-y-3">
                {PLATFORM_SIGNALS.map((sig) => (
                  <div key={sig.id} className="flex items-center gap-2">
                    <PlatformBadge platform={sig.platform} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono-custom font-bold text-foreground tabular-nums">
                          {sig.score}
                        </span>
                        <span className="text-xs font-sans text-accent">{sig.delta}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full mt-1">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${sig.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-sans mt-0.5">{sig.volume}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                  Hashtags
                </h3>
                <button
                  onClick={copyAllHashtags}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-sans"
                >
                  {copiedHashtags ? <CheckCheck size={12} /> : <Copy size={12} />}
                  Copy all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TREND.hashtags.map((tag) => (
                  <span
                    key={`hashtag-${tag}`}
                    className="text-xs font-mono-custom px-2 py-1 bg-muted text-muted-foreground rounded-lg hover:text-foreground cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Key metrics */}
            <div className="card-surface p-4">
              <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3">
                Key Metrics
              </h3>
              <div className="space-y-2.5">
                {[
                  { id: 'km-cvs', label: 'Creator Velocity', value: '0.88', unit: 'CVS' },
                  { id: 'km-ss', label: 'Spike Score', value: '4.2×', unit: 'SS' },
                  { id: 'km-cps', label: 'Cross-Platform', value: '3/4', unit: 'CPS' },
                  {id: 'km-mentions', label: 'Mentions 24h', value: '128.4K', unit: '' },
                  { id: 'km-creators', label: 'Creators Active', value: '4,821', unit: '' },
                ].map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <span className="text-xs font-sans text-muted-foreground">{m.label}</span>
                    <span className="text-xs font-mono-custom font-bold text-foreground tabular-nums">
                      {m.value} {m.unit && <span className="text-muted-foreground text-xs">{m.unit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Trending Posts column — shown as third column on xl+ */}
          <div className="w-72 xl:w-80 flex-shrink-0 hidden xl:flex flex-col gap-4">
            <RealTimeTrendingPosts />
          </div>
        </div>
      </div>
    </div>
  );
}