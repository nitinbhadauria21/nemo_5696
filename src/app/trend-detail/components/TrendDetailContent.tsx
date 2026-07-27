'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, Plus, Copy, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import TrendSparkline from '@/components/ui/TrendSparkline';
import ScoreBreakdownPanel from './ScoreBreakdownPanel';
import AIAnalysisSection from './AIAnalysisSection';
import RealTimeTrendingPosts from './RealTimeTrendingPosts';
import TrendVolumeChart from './TrendVolumeChart';
import TrendGeoChart from './TrendGeoChart';
import CountrySelector from '@/components/ui/CountrySelector';
import { COUNTRIES } from '@/lib/countries';
import { MOCK_TRENDS, type TrendItem } from '@/lib/mockData';

function toUiTrend(t: TrendItem) {
  return {
    id: t.id,
    title: t.title,
    category: t.category,
    status: t.status,
    nemoScore: t.nemoScore,
    cvs: t.cvs,
    ss: t.ss,
    cps: t.cps,
    freshness: t.freshness,
    platforms: t.platforms,
    creatorsCount: t.creatorsCount,
    mentions24h: t.mentions24h,
    sparklineData: t.sparklineData,
    timeAgo: t.timeAgo,
    hashtags: t.hashtags,
    description: t.description,
  };
}

interface TrendDetailContentProps {
  trendId?: string;
}

export default function TrendDetailContent({ trendId: trendIdProp }: TrendDetailContentProps = {}) {
  const searchParams = useSearchParams();
  const trendId = trendIdProp ?? searchParams.get('id');
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(true);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [remoteTrend, setRemoteTrend] = useState<TrendItem | null>(null);
  const [relatedTrends, setRelatedTrends] = useState<TrendItem[]>([]);
  const [windowHoursLeft, setWindowHoursLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = trendId ? `/api/trends/${trendId}` : '/api/trends';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          if (data.trend) {
            setRemoteTrend(data.trend);
            setRelatedTrends(data.related ?? []);
          } else {
            const list = (data.trends ?? data) as TrendItem[];
            if (Array.isArray(list) && list.length) {
              const match = trendId ? list.find((t) => t.id === trendId) : list[0];
              if (match) setRemoteTrend(match);
            }
          }
        }
      } catch {
        // fall back to mock
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [trendId]);

  useEffect(() => {
    if (!remoteTrend?.firstDetectedAt) return;
    const update = () => {
      const ageH = (Date.now() - new Date(remoteTrend.firstDetectedAt).getTime()) / 3600000;
      setWindowHoursLeft(Math.max(0, 72 - ageH));
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [remoteTrend?.firstDetectedAt]);

  const TREND = useMemo(() => {
    const fromRemote = remoteTrend;
    const fromMock = trendId
      ? MOCK_TRENDS.find((t) => t.id === trendId)
      : MOCK_TRENDS[0];
    return toUiTrend(fromRemote ?? fromMock ?? MOCK_TRENDS[0]);
  }, [remoteTrend, trendId]);

  const PLATFORM_SIGNALS = TREND.platforms.slice(0, 4).map((platform, i) => ({
    id: `sig-${platform}`,
    platform,
    label: platform,
    score: Math.max(40, Math.min(99, Math.round(TREND.nemoScore - i * 6))),
    volume: `${Math.round(TREND.mentions24h / (i + 1)).toLocaleString()} signals`,
    delta: `+${Math.round(20 + TREND.ss / 2)}%`,
  }));

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
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border px-5 sm:px-6 py-3.5">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-foreground/60 hover:text-foreground transition-colors text-base font-bold font-sans flex-shrink-0"
            >
              <ArrowLeft size={17} />
              Back
            </Link>
            <div className="w-px h-5 bg-border" />
            <StatusBadge status={TREND.status} size="sm" />
            <span className="text-base text-foreground/65 font-sans font-medium hidden sm:block">{TREND.category}</span>
            <h1 className="font-display text-xl font-bold text-foreground truncate hidden md:block">
              {TREND.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border bg-card text-base font-bold font-sans hover:bg-muted transition-all"
            >
              {bookmarked ? <BookmarkCheck size={15} className="text-primary" /> : <Bookmark size={15} />}
              {bookmarked ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => toast('Share link copied!')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border bg-card text-base font-bold font-sans hover:bg-muted transition-all"
            >
              <Share2 size={15} />
              Share
            </button>
            <button
              onClick={() => router.push(`/carousel?topic=${encodeURIComponent(TREND.title)}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-border bg-card text-sm font-bold font-sans hover:bg-muted transition-all"
            >
              Create Carousel
            </button>
            <button className="btn-flame flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl">
              <Plus size={15} />
              Add to Queue
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
        {selectedCountryNames.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20 text-sm font-sans mb-5">
            <span className="text-primary font-bold">Viewing trend data for:</span>
            <span className="text-foreground font-medium">
              {selectedCountryNames.map((c) => `${c!.flag} ${c!.name}`).join(' · ')}
            </span>
          </div>
        )}
        <div className="xl:hidden mb-5">
          <RealTimeTrendingPosts />
        </div>

        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-5">
            <div className="bg-card border-2 border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl font-extrabold text-foreground mb-2">{TREND.title}</h2>
                  <p className="text-base font-sans text-muted-foreground leading-relaxed mb-4">{TREND.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {TREND.platforms.map((p) => (
                      <PlatformBadge key={`detail-plat-${p}`} platform={p} size="md" />
                    ))}
                    <span className="text-sm font-sans font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full">
                      {TREND.creatorsCount.toLocaleString()} creators
                    </span>
                    <span className="text-sm font-sans font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full">
                      {TREND.mentions24h.toLocaleString()} mentions 24h
                    </span>
                    <span className="text-sm font-sans font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full">
                      {TREND.timeAgo}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <TrendSparkline data={TREND.sparklineData} width={100} height={40} trend="up" />
                  <span className="text-xs font-mono-custom font-semibold text-muted-foreground">7-day signal</span>
                </div>
              </div>
            </div>

            <ScoreBreakdownPanel finalScore={TREND.nemoScore} />

            {windowHoursLeft !== null && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-sans">
                <span className="font-mono-custom font-bold text-amber-700">Trend window: </span>
                {windowHoursLeft > 0
                  ? `${Math.floor(windowHoursLeft)}h left in peak capture window`
                  : 'Window closing — trend may be declining'}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              <TrendVolumeChart sparkline={TREND.sparklineData} />
              <TrendGeoChart regions={remoteTrend?.geoRegions} />
            </div>

            {relatedTrends.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Related Trends
                </h3>
                <div className="flex flex-wrap gap-2">
                  {relatedTrends.map((t) => (
                    <Link
                      key={t.id}
                      href={`/trend/${t.id}`}
                      className="text-xs font-sans font-semibold px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors"
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Top Performing Content
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(remoteTrend?.topContent ?? [
                  { id: '1', title: 'Viral hook breakdown', views: '1.2M', platform: TREND.platforms[0] },
                  { id: '2', title: 'Creator reaction clip', views: '840K', platform: TREND.platforms[1] ?? TREND.platforms[0] },
                  { id: '3', title: 'Trend explainer short', views: '520K', platform: TREND.platforms[0] },
                ]).slice(0, 3).map((item: { id: string; title: string; views: string; platform?: string }) => (
                  <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center text-2xl">
                      {item.platform === 'youtube' ? '▶️' : item.platform === 'instagram' ? '📸' : '🔥'}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-sans font-semibold text-foreground line-clamp-2">{item.title}</p>
                      <p className="text-xs font-mono-custom text-muted-foreground mt-1">{item.views} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground">
                AI-Powered Analysis
              </h3>
              <AIAnalysisSection type="analysis" trendTitle={TREND.title} />
              <AIAnalysisSection type="sentiment" trendTitle={TREND.title} />
              <AIAnalysisSection type="ideas" trendTitle={TREND.title} />
            </div>
          </div>

          <div className="w-64 xl:w-72 flex-shrink-0 hidden lg:flex flex-col gap-4">
            <div className="bg-card border-2 border-border rounded-2xl p-4">
              <h3 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Platform Signals
              </h3>
              <div className="space-y-4">
                {PLATFORM_SIGNALS.map((sig) => (
                  <div key={sig.id} className="flex items-center gap-3">
                    <PlatformBadge platform={sig.platform} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-mono-custom font-bold text-foreground tabular-nums">{sig.score}</span>
                        <span className="text-sm font-bold font-sans text-accent">{sig.delta}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${sig.score}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground font-sans mt-1 font-medium">{sig.volume}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">Hashtags</h3>
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

            <div className="bg-card border-2 border-border rounded-2xl p-4">
              <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3">
                Key Metrics
              </h3>
              <div className="space-y-2.5">
                {[
                  { id: 'km-cvs', label: 'Creator Velocity', value: String(TREND.cvs), unit: 'CVS' },
                  { id: 'km-ss', label: 'Spike Score', value: String(TREND.ss), unit: 'SS' },
                  { id: 'km-cps', label: 'Cross-Platform', value: String(TREND.cps), unit: 'CPS' },
                  {
                    id: 'km-mentions',
                    label: 'Mentions 24h',
                    value: `${(TREND.mentions24h / 1000).toFixed(1)}K`,
                    unit: '',
                  },
                  {
                    id: 'km-creators',
                    label: 'Creators Active',
                    value: TREND.creatorsCount.toLocaleString(),
                    unit: '',
                  },
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

          <div className="w-72 xl:w-80 flex-shrink-0 hidden xl:flex flex-col gap-4">
            <RealTimeTrendingPosts />
          </div>
        </div>
      </div>
    </div>
  );
}
