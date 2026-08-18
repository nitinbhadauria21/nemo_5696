'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, Plus, Copy, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import PlatformIcon from '@/components/ui/PlatformIcon';
import TrendSparkline from '@/components/ui/TrendSparkline';
import ScoreBreakdownPanel from './ScoreBreakdownPanel';
import AIAnalysisSection from './AIAnalysisSection';
import TrendFeedbackControl from './TrendFeedbackControl';
import RealTimeTrendingPosts from './RealTimeTrendingPosts';
import TrendVolumeChart from './TrendVolumeChart';
import TrendGeoChart from './TrendGeoChart';
import CountrySelector from '@/components/ui/CountrySelector';
import { COUNTRIES } from '@/lib/countries';
import { MOCK_TRENDS, type TrendItem } from '@/lib/mockData';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { hasRealCountryMix, type GeoShare } from '@/lib/trends/geoChart';
import {
  isRealHttpUrl,
  isRealSourceMedia,
  sourceCaption,
  youtubeThumbnailUrl,
  youtubeVideoIdFrom,
  youtubeWatchUrl,
} from '@/lib/trends/mediaResolve';

/** Coerce niche/category payloads that may arrive as objects from collectors. */
function formatCategoryLabel(category: unknown): string {
  if (category == null) return 'General';
  if (typeof category === 'string') {
    const trimmed = category.trim();
    return trimmed && trimmed !== '[object Object]' ? trimmed : 'General';
  }
  if (typeof category === 'number' || typeof category === 'boolean') return String(category);
  if (Array.isArray(category)) {
    const first = category.find((c) => c != null);
    return first != null ? formatCategoryLabel(first) : 'General';
  }
  if (typeof category === 'object') {
    const o = category as Record<string, unknown>;
    const candidate = o.name ?? o.label ?? o.title ?? o.niche ?? o.category;
    if (candidate != null) return formatCategoryLabel(candidate);
  }
  return 'General';
}

function toUiTrend(t: TrendItem) {
  return {
    id: t.id,
    title: t.title,
    category: formatCategoryLabel(t.category),
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
    whyTrending: t.whyTrending || [],
    velocity: t.velocity,
    acceleration: t.acceleration ?? 0,
    geoRegions: t.geoRegions,
    geoShares: t.geoShares,
  };
}

type HistoryPayload = {
  series?: Array<{
    windowHours: number;
    points: Array<{ at: string; score: number; mentions: number }>;
    velocities?: {
      mention?: number;
      creator?: number;
      score?: number;
      acceleration?: number;
    };
  }>;
  peakScore?: number;
  peakVelocity?: number;
  peakAcceleration?: number;
  velocities?: {
    mention?: number;
    creator?: number;
    score?: number;
    acceleration?: number;
  };
  durationHours?: number;
  snapshotCount?: number;
};

type SourceRow = {
  id: number;
  platform: string;
  title: string | null;
  url: string | null;
  creator: string | null;
  published_at: string | null;
  collected_at: string;
  external_id?: string | null;
  metadata?: {
    views?: string;
    historical?: boolean;
    thumbnail?: string;
    imageUrl?: string;
  } | null;
};

function sourceThumb(item: {
  url?: string | null;
  thumbnail?: string | null;
  externalId?: string | null;
}): string | undefined {
  const direct = item.thumbnail?.trim();
  if (isRealHttpUrl(direct)) return direct;
  const id = youtubeVideoIdFrom(item.url) || youtubeVideoIdFrom(item.externalId);
  return id ? youtubeThumbnailUrl(id) : undefined;
}

function sourceHref(item: { url?: string | null; externalId?: string | null }): string | undefined {
  if (isRealHttpUrl(item.url)) return item.url!.trim();
  const id = youtubeVideoIdFrom(item.externalId);
  return id ? youtubeWatchUrl(id) : undefined;
}

function RepresentativeContentCard({
  item,
  fallbackPlatform,
}: {
  item: {
    id: string;
    title: string;
    views: string;
    platform?: string;
    historical?: boolean;
    url?: string;
    thumbnail?: string;
    creator?: string | null;
  };
  fallbackPlatform: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const href = sourceHref({ url: item.url });
  const thumb = sourceThumb({ url: item.url, thumbnail: item.thumbnail });
  const showImg = Boolean(thumb) && !imgFailed;
  const caption = sourceCaption({
    url: href,
    views: item.views,
    creator: item.creator,
  });

  const media = (
    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
      {showImg ? (
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <PlatformIcon
          platform={item.platform || fallbackPlatform || 'google'}
          size={28}
          withTile={false}
        />
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {media}
        </a>
      ) : (
        media
      )}
      <div className="p-3">
        <p className="text-xs font-sans font-semibold text-foreground line-clamp-2">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </p>
        {(caption || item.historical) && (
          <p className="text-xs font-mono-custom text-muted-foreground mt-1">
            {caption}
            {item.historical ? `${caption ? ' · ' : ''}historical context` : ''}
          </p>
        )}
      </div>
    </div>
  );
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
  const [chartWindow, setChartWindow] = useState(72);
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [sourcesReady, setSourcesReady] = useState(false);
  const [geoShares, setGeoShares] = useState<GeoShare[] | undefined>(undefined);
  const [geoRegions, setGeoRegions] = useState<string[] | undefined>(undefined);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoFailed, setGeoFailed] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const enrichKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    enrichKeyRef.current = null;
    setSourcesReady(false);
    setSources([]);
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
            setGeoShares(data.trend.geoShares);
            setGeoRegions(data.trend.geoRegions);
            setGeoFailed(false);
            enrichKeyRef.current = null;
          } else {
            const list = (data.trends ?? data) as TrendItem[];
            if (Array.isArray(list) && list.length) {
              const match = trendId ? list.find((t) => t.id === trendId) : list[0];
              if (match) {
                setRemoteTrend(match);
                setGeoShares(match.geoShares);
                setGeoRegions(match.geoRegions);
                setGeoFailed(false);
                enrichKeyRef.current = null;
              }
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
    if (!trendId) return;
    let cancelled = false;
    (async () => {
      try {
        const [hRes, sRes] = await Promise.all([
          fetch(`/api/trends/${trendId}/history`),
          fetch(`/api/trends/${trendId}/sources`),
        ]);
        if (hRes.ok) {
          const h = await hRes.json();
          if (!cancelled) setHistory(h);
        }
        if (sRes.ok) {
          const s = await sRes.json();
          if (!cancelled) setSources(s.sources || []);
        }
      } catch {
        // optional enrichment
      } finally {
        if (!cancelled) setSourcesReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trendId]);

  const runEnrich = (force = false) => {
    if (!trendId || !remoteTrend) return;
    const needGeo = !hasRealCountryMix({
      shares: geoShares ?? remoteTrend.geoShares,
      regions: geoRegions ?? remoteTrend.geoRegions,
    });
    const sourceIncomplete =
      sources.length === 0 ||
      sources.some((s) => {
        const thumb = s.metadata?.thumbnail || s.metadata?.imageUrl;
        return !isRealSourceMedia({
          url: sourceHref({ url: s.url, externalId: s.external_id }),
          thumbnail: thumb,
        });
      });
    const topIncomplete = (remoteTrend.topContent ?? []).some(
      (item) => !isRealSourceMedia({ url: item.url, thumbnail: item.thumbnail })
    );
    const needSources = sourceIncomplete || (sources.length === 0 && topIncomplete);
    if (!needGeo && !needSources) return;

    const key = `${trendId}:${needGeo ? 'geo' : ''}${needSources ? 'src' : ''}`;
    if (!force && enrichKeyRef.current === key) return;
    enrichKeyRef.current = key;

    if (needGeo) {
      setGeoLoading(true);
      setGeoFailed(false);
    }
    if (needSources) setContentLoading(true);

    void (async () => {
      try {
        const kind = needGeo && needSources ? 'all' : needGeo ? 'geo' : 'sources';
        const res = await fetch(`/api/trends/${encodeURIComponent(trendId)}/enrich`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind }),
        });
        if (!res.ok) {
          if (needGeo) setGeoFailed(true);
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.geoShares) && data.geoShares.length) {
          setGeoShares(data.geoShares);
        }
        if (Array.isArray(data.geoRegions) && data.geoRegions.length) {
          setGeoRegions(data.geoRegions);
        } else if (Array.isArray(data.geoShares) && data.geoShares.length) {
          setGeoRegions(data.geoShares.map((s: GeoShare) => s.country));
        }
        if (needGeo) {
          const mergedShares =
            Array.isArray(data.geoShares) && data.geoShares.length
              ? data.geoShares
              : (geoShares ?? remoteTrend.geoShares);
          const mergedRegions =
            Array.isArray(data.geoRegions) && data.geoRegions.length
              ? data.geoRegions
              : Array.isArray(data.geoShares) && data.geoShares.length
                ? data.geoShares.map((s: GeoShare) => s.country)
                : (geoRegions ?? remoteTrend.geoRegions);
          setGeoFailed(
            Boolean(data.geoFailed) ||
              !hasRealCountryMix({ shares: mergedShares, regions: mergedRegions })
          );
        }
        if (Array.isArray(data.sources) && data.sources.length) {
          setSources(data.sources);
        }
      } catch {
        if (needGeo) setGeoFailed(true);
      } finally {
        setGeoLoading(false);
        setContentLoading(false);
      }
    })();
  };

  useEffect(() => {
    if (!sourcesReady) return;
    runEnrich(false);
    // Enrich once per trend after initial trend + sources land.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendId, remoteTrend, sourcesReady]);

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
    const overlay = (t: TrendItem) => ({
      ...toUiTrend(t),
      geoRegions: geoRegions ?? t.geoRegions,
      geoShares: geoShares ?? t.geoShares,
    });
    if (remoteTrend) return overlay(remoteTrend);
    const fromMock = !isSupabaseConfigured()
      ? trendId
        ? MOCK_TRENDS.find((t) => t.id === trendId)
        : MOCK_TRENDS[0]
      : undefined;
    if (fromMock) return overlay(fromMock);
    return null;
  }, [remoteTrend, trendId, geoRegions, geoShares]);

  const activeSeries = useMemo(() => {
    const series = history?.series || [];
    return (
      series.find((s) => s.windowHours === chartWindow) ||
      series.find((s) => s.windowHours === 72) ||
      series[series.length - 1]
    );
  }, [history, chartWindow]);

  if (!TREND) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <p className="font-display text-xl font-bold">Trend not found</p>
          <p className="text-muted-foreground text-sm">This trend is not in the live feed.</p>
          <Link href="/dashboard" className="text-primary font-semibold text-sm hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

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

  const whyBullets = TREND.whyTrending?.length
    ? TREND.whyTrending
    : ([
        `Score ${Math.round(TREND.nemoScore)}`,
        `Velocity ${TREND.velocity.toFixed(2)}x`,
        TREND.platforms.length >= 2 ? `On ${TREND.platforms.length} platforms` : null,
      ].filter(Boolean) as string[]);

  const contentItems =
    sources.length > 0
      ? sources.slice(0, 6).map((s) => {
          const href = sourceHref({ url: s.url, externalId: s.external_id });
          const thumb = sourceThumb({
            url: href,
            thumbnail: s.metadata?.thumbnail || s.metadata?.imageUrl,
            externalId: s.external_id,
          });
          return {
            id: String(s.id),
            title: s.title || TREND.title,
            views: sourceCaption({
              views: s.metadata?.views,
              url: href,
              creator: s.creator,
            }),
            platform: s.platform,
            historical: Boolean(s.metadata?.historical) || Boolean(s.published_at),
            url: href,
            thumbnail: thumb,
            creator: s.creator,
          };
        })
      : (remoteTrend?.topContent ?? []).map((item) => {
          const href = sourceHref({ url: item.url });
          return {
            ...item,
            historical: false as boolean,
            url: href,
            thumbnail: sourceThumb({ url: href, thumbnail: item.thumbnail }),
            creator: undefined as string | undefined,
          };
        });

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
            <span className="text-base text-foreground/65 font-sans font-medium hidden sm:block">
              {TREND.category}
            </span>
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
              {bookmarked ? (
                <BookmarkCheck size={15} className="text-primary" />
              ) : (
                <Bookmark size={15} />
              )}
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
                  <h2 className="font-display text-2xl font-extrabold text-foreground mb-2">
                    {TREND.title}
                  </h2>
                  <p className="text-base font-sans text-muted-foreground leading-relaxed mb-4">
                    {TREND.description}
                  </p>
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
                  <span className="text-xs font-mono-custom font-semibold text-muted-foreground">
                    Signal
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-5">
              <h3 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Why it&apos;s trending
              </h3>
              <ul className="space-y-2">
                {whyBullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm font-sans text-foreground">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {(history?.velocities || activeSeries?.velocities) && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {[
                    {
                      label: 'Score vel',
                      value: `${(history?.velocities?.score ?? activeSeries?.velocities?.score ?? TREND.velocity).toFixed(2)}x`,
                    },
                    {
                      label: 'Mention vel',
                      value: `${(history?.velocities?.mention ?? activeSeries?.velocities?.mention ?? 1).toFixed(2)}x`,
                    },
                    {
                      label: 'Accel',
                      value: `${(history?.velocities?.acceleration ?? activeSeries?.velocities?.acceleration ?? TREND.acceleration) >= 0 ? '+' : ''}${(history?.velocities?.acceleration ?? activeSeries?.velocities?.acceleration ?? TREND.acceleration).toFixed(2)}`,
                    },
                    {
                      label: 'Peak score',
                      value: String(Math.round(history?.peakScore ?? TREND.nemoScore)),
                    },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg bg-muted/50 px-3 py-2">
                      <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">
                        {m.label}
                      </div>
                      <div className="font-mono-custom font-bold tabular-nums">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
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

            <div className="flex flex-wrap gap-2">
              {[1, 6, 12, 24, 48, 72].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setChartWindow(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    chartWindow === h
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-foreground/70'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <TrendVolumeChart
                sparkline={TREND.sparklineData}
                points={activeSeries?.points}
                windowHours={chartWindow}
                velocities={activeSeries?.velocities || history?.velocities}
              />
              <TrendGeoChart
                regions={TREND.geoRegions}
                shares={TREND.geoShares}
                loading={
                  geoLoading ||
                  (!hasRealCountryMix({ shares: TREND.geoShares }) &&
                    !hasRealCountryMix({ regions: TREND.geoRegions }) &&
                    !geoFailed)
                }
                failed={geoFailed}
                onRetry={() => {
                  enrichKeyRef.current = null;
                  runEnrich(true);
                }}
              />
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
                Representative content
              </h3>
              {contentItems.length === 0 && contentLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={`content-skel-${n}`}
                      className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                      <div className="aspect-video bg-muted animate-pulse" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {contentItems.slice(0, 6).map((item) => (
                    <RepresentativeContentCard
                      key={item.id}
                      item={item}
                      fallbackPlatform={TREND.platforms[0] || 'google'}
                    />
                  ))}
                </div>
              )}
            </div>

            {TREND.id && <TrendFeedbackControl trendId={TREND.id} />}

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    AI analysis (secondary)
                  </h3>
                  <p className="text-xs font-sans text-muted-foreground mt-1">
                    Optional insights — metrics above are the primary explanation
                  </p>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4">
                <AIAnalysisSection type="analysis" trendTitle={TREND.title} />
                <AIAnalysisSection type="sentiment" trendTitle={TREND.title} />
                <AIAnalysisSection type="ideas" trendTitle={TREND.title} />
              </div>
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
                        <span className="text-sm font-mono-custom font-bold text-foreground tabular-nums">
                          {sig.score}
                        </span>
                        <span className="text-sm font-bold font-sans text-accent">{sig.delta}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${sig.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-sans mt-1 font-medium">
                        {sig.volume}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-4">
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

            <div className="bg-card border-2 border-border rounded-2xl p-4">
              <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3">
                Key Metrics
              </h3>
              <div className="space-y-2.5">
                {[
                  {
                    id: 'km-cvs',
                    label: 'Creator Velocity',
                    value: String(TREND.cvs),
                    unit: 'CVS',
                  },
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
                      {m.value}{' '}
                      {m.unit && <span className="text-muted-foreground text-xs">{m.unit}</span>}
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
