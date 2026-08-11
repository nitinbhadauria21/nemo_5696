import type { TrendItem, TrendPlatform, TrendStatus } from '@/lib/mockData';
import type { Platform } from '@/lib/signals';
import {
  computeFullNemoScore,
  collectGoogleTrendsSignals,
  collectRedditSignals,
  collectYouTubeSignals,
  scoreGoogleTrendsSignals,
  scoreRedditSignals,
  scoreYouTubeSignals,
} from '@/lib/signals';
import { classifyTrendNiche } from './publicCopy';

function hashId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return `trend-${Math.abs(h).toString(16)}`;
}

function statusFromNemo(score: number): TrendStatus {
  if (score >= 70) return 'hot';
  if (score >= 35) return 'rising';
  return 'fading';
}

function timeAgoFromHours(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function mapUiPlatforms(platforms: TrendPlatform[]): Platform[] {
  return platforms.map((p) => {
    if (p === 'google') return 'google_trends';
    if (p === 'youtube_shorts') return 'youtube';
    return p;
  });
}

/** Collection geo: GLOBAL by default; else 2-letter country from env. */
export function collectionGeoRegions(override?: string | null): string[] {
  const raw = (override ?? process.env.GOOGLE_TRENDS_GEO ?? 'GLOBAL').trim().toUpperCase();
  if (!raw || raw === 'GLOBAL' || raw === 'WW' || raw === 'WORLD') return ['GLOBAL'];
  return [raw.slice(0, 2)];
}

/** Map free-text / DB niche toward brief Dashboard niches. */
export function mapToUiCategory(raw: string | undefined | null, titleHint = ''): string {
  return classifyTrendNiche({ rawNiche: raw, title: titleHint });
}

/** Discard at ingest when older than 30 days. */
const MAX_TREND_AGE_HOURS = 30 * 24;
/** Extra freshness penalty when older than 7 days (kept until 30d discard). */
const STALE_AGE_HOURS = 7 * 24;
const STALE_FRESHNESS_FACTOR = 0.45;

/**
 * Conservative prior when no real history: ~0.45–0.65× current so Spike Score
 * is non-zero for rising content (never leave prev === current).
 */
function estimateMentionsPrev24h(mentions24h: number, seed = 0): number {
  const ratio = 0.45 + (Math.abs(seed) % 21) / 100; // 0.45–0.65
  return Math.max(10, Math.round(Math.max(0, mentions24h) * ratio));
}

function resolveMentionsPrev24h(
  mentions24h: number,
  mentionsPrev24h: number,
  topicSeed: string
): number {
  const prev = Math.max(0, mentionsPrev24h);
  const curr = Math.max(0, mentions24h);
  // Treat missing / flat priors as “no history”
  if (prev <= 0 || curr <= 0 || Math.abs(prev - curr) / Math.max(curr, 1) < 0.05) {
    let h = 0;
    for (let i = 0; i < topicSeed.length; i++) h = (h * 31 + topicSeed.charCodeAt(i)) | 0;
    return estimateMentionsPrev24h(curr, h);
  }
  return Math.max(10, prev);
}

/**
 * Keep creator windows non-flat so CVS can differentiate rising topics.
 * Ensures creators72h is meaningfully above creators24h (and 6h ≤ 24h).
 */
function resolveCreatorWindows(
  creators6h: number,
  creators24h: number,
  creators72h: number
): { creators6h: number; creators24h: number; creators72h: number } {
  const c24 = Math.max(1, Math.round(creators24h));
  let c72 = Math.max(1, Math.round(creators72h));
  let c6 = Math.max(1, Math.round(creators6h || c24 / 3));

  if (c24 >= c72 * 0.92) {
    c72 = Math.max(c72, Math.round(c24 / 0.55));
  }
  c72 = Math.max(c72, c24 + Math.max(5, Math.round(c24 * 0.35)));
  c6 = Math.min(c6, c24);
  if (c6 >= c24 * 0.95) {
    c6 = Math.max(1, Math.round(c24 * 0.35));
  }
  return { creators6h: c6, creators24h: c24, creators72h: c72 };
}

function toTrendItem(input: {
  topic: string;
  niche: string;
  platforms: TrendPlatform[];
  creators6h: number;
  creators24h: number;
  creators72h: number;
  mentions24h: number;
  mentionsPrev24h: number;
  ageHours: number;
  description?: string;
  hashtags?: string[];
  geoRegions?: string[];
}): TrendItem | null {
  const ageHours = Math.max(0.25, input.ageHours);
  // Product time rule: do not persist / surface evergreen content older than 30 days
  if (ageHours > MAX_TREND_AGE_HOURS) return null;

  const mentions24h = Math.max(0, input.mentions24h);
  const mentionsPrev24h = resolveMentionsPrev24h(mentions24h, input.mentionsPrev24h, input.topic);
  const { creators6h, creators24h, creators72h } = resolveCreatorWindows(
    input.creators6h,
    input.creators24h,
    input.creators72h
  );

  const firstDetectedAt = new Date(Date.now() - ageHours * 3600 * 1000).toISOString();
  const latestActivityAt = new Date().toISOString();
  // Scoring engine hard-expires at 7d. For 7–30d keep a penalized score instead of zeroing.
  const stale = ageHours > STALE_AGE_HOURS;
  const scoringAgeHours = stale ? STALE_AGE_HOURS - 0.5 : ageHours;
  const scoringDetectedAt = new Date(Date.now() - scoringAgeHours * 3600 * 1000).toISOString();
  const category = classifyTrendNiche({
    rawNiche: input.niche,
    title: input.topic,
    description: input.description,
    hashtags: input.hashtags,
  });
  const geoRegions = input.geoRegions?.length ? input.geoRegions : collectionGeoRegions();
  const score = computeFullNemoScore({
    creatorVelocityInputs: {
      creators_last_6h: creators6h,
      creators_last_24h: creators24h,
      creators_last_72h: creators72h,
      historical_max_velocity_for_platform: Math.max(creators24h * 1.2, 100),
    },
    spikeInputs: {
      mentions_last_24h: mentions24h,
      mentions_prev_24h: Math.max(mentionsPrev24h, 10),
    },
    crossPlatformInputs: {
      platforms_present: mapUiPlatforms(input.platforms),
    },
    freshnessInputs: {
      first_detected_at: scoringDetectedAt,
      now: new Date().toISOString(),
    },
  });

  let freshnessMultiplier = score.freshness_multiplier;
  let freshnessScore = score.freshness_score;
  let nemoScore = score.nemo_score;
  if (stale) {
    freshnessMultiplier = Math.max(0.1, freshnessMultiplier * STALE_FRESHNESS_FACTOR);
    freshnessScore = Math.round(freshnessMultiplier * 100 * 100) / 100;
    nemoScore = Math.min(100, Math.max(0, nemoScore * STALE_FRESHNESS_FACTOR));
  }

  const spark = Array.from({ length: 9 }, (_, i) =>
    Math.max(5, Math.min(100, Math.round(nemoScore * (0.4 + i * 0.07) + (i % 3) * 4)))
  );

  return {
    id: hashId(input.topic),
    title: input.topic,
    category,
    niches: [category],
    status: statusFromNemo(nemoScore),
    nemoScore: Math.round(nemoScore),
    cvs: Math.round(score.creator_velocity_score),
    ss: Math.round(score.spike_score),
    cps: Math.round(score.cross_platform_score),
    freshness: Math.round(freshnessScore),
    freshnessMultiplier,
    platforms: input.platforms,
    creatorsCount: creators72h,
    mentions24h,
    mentionsPrev24h,
    creatorsLast6h: creators6h,
    creatorsLast24h: creators24h,
    creatorsLast72h: creators72h,
    sparklineData: spark,
    timeAgo: timeAgoFromHours(ageHours),
    firstDetectedAt,
    latestActivityAt,
    hashtags: input.hashtags ?? [`#${input.topic.replace(/\s+/g, '')}`],
    description:
      input.description ??
      `${input.topic} is accelerating across ${input.platforms.join(', ')} with rising creator velocity.`,
    isBookmarked: false,
    velocity: Number((mentions24h / Math.max(mentionsPrev24h, 1)).toFixed(2)),
    spike: Number((mentions24h / Math.max(mentionsPrev24h, 1)).toFixed(2)),
    contentType: 'TOPIC',
    geoRegions,
  };
}

function compactTrends(items: Array<TrendItem | null | undefined>): TrendItem[] {
  return items.filter((t): t is TrendItem => t != null);
}

/** Reddit public JSON — no API key required. Platforms tag is honest: reddit only. */
export async function collectRedditTrends(): Promise<TrendItem[]> {
  const urls = [
    'https://www.reddit.com/r/popular/hot.json?limit=15',
    'https://old.reddit.com/r/popular/hot.json?limit=15',
    'https://www.reddit.com/r/popular/rising.json?limit=15',
    'https://old.reddit.com/r/popular/rising.json?limit=15',
    'https://www.reddit.com/r/all/hot.json?limit=12',
    'https://old.reddit.com/r/all/hot.json?limit=12',
  ];
  const headers = {
    'User-Agent': 'NemoTrends/1.1 (creator trend intelligence; +https://nemo-5696.vercel.app)',
    Accept: 'application/json',
  };
  const geo = collectionGeoRegions('GLOBAL');

  async function fetchRedditJson(url: string): Promise<any | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(url, {
          headers,
          cache: 'no-store',
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timer);
        if (!res.ok) {
          console.error('Reddit collector HTTP', res.status, url, `attempt=${attempt + 1}`);
          if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        return await res.json();
      } catch (err) {
        console.error('Reddit collector fetch failed', url, `attempt=${attempt + 1}`, err);
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    return null;
  }

  try {
    let json: any = null;
    for (const url of urls) {
      json = await fetchRedditJson(url);
      if (json?.data?.children?.length) break;
    }
    if (!json?.data?.children?.length) {
      console.error('Reddit collector: all hosts/retries exhausted');
      return [];
    }

    const posts = json.data.children;
    return compactTrends(
      posts.slice(0, 10).map((child: any, idx: number) => {
        const p = child.data;
        const score = typeof p.score === 'number' ? p.score : 100;
        const comments = typeof p.num_comments === 'number' ? p.num_comments : 10;
        const ageHours = Math.max(
          0.25,
          (Date.now() / 1000 - (p.created_utc || Date.now() / 1000)) / 3600
        );
        const signals = collectRedditSignals({
          score_velocity_5min: Math.max(1, Math.round(score / 40)),
          score_velocity_15min: Math.max(1, Math.round(score / 25)),
          score_velocity_60min: Math.max(1, Math.round(score / 10)),
          comment_velocity: Math.max(1, Math.round(comments / 8)),
          cross_subreddit_count: 1,
          sort_positions: ['hot', 'rising'],
          post_age_hours: ageHours,
          subreddit_subscriber_count: Number(p.subreddit_subscribers || 100000),
          upvote_ratio: p.upvote_ratio ?? 0.9,
          nsfw_flag: Boolean(p.over_18),
          subreddit_names: [p.subreddit],
          post_ids_sample: [p.id],
          collected_at: new Date().toISOString(),
        });
        scoreRedditSignals(signals, { max_score_velocity: 200, max_comment_velocity: 100 });

        const mentions24h = Math.max(50, score);
        const title = String(p.title || `Reddit trend ${idx}`).slice(0, 120);
        const hashtags = [`#${p.subreddit}`, '#reddit'];
        return toTrendItem({
          topic: title,
          niche: classifyTrendNiche({
            rawNiche: String(p.subreddit || ''),
            title,
            description: String(p.selftext || '').slice(0, 240),
            hashtags,
          }),
          platforms: ['reddit'],
          creators6h: Math.max(5, Math.round(comments / 8)),
          creators24h: Math.max(20, Math.round(comments / 2)),
          creators72h: Math.max(40, comments),
          mentions24h,
          mentionsPrev24h: estimateMentionsPrev24h(mentions24h),
          ageHours: Math.max(0.25, ageHours),
          description: `Trending on r/${p.subreddit}: ${String(p.title || '').slice(0, 160)}`,
          hashtags,
          geoRegions: geo,
        });
      })
    );
  } catch (err) {
    console.error('Reddit collector failed', err);
    return [];
  }
}

function mergeTrendsByTitle(items: TrendItem[]): TrendItem[] {
  const byTitle = new Map<string, TrendItem>();
  for (const t of items) {
    const key = t.title.toLowerCase().replace(/\s+/g, ' ').trim();
    const existing = byTitle.get(key);
    if (!existing || t.nemoScore > existing.nemoScore) byTitle.set(key, t);
  }
  return [...byTitle.values()];
}

function ageHoursFromIso(iso?: string | null, fallback = 6): number {
  if (!iso) return fallback;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return fallback;
  return Math.max(0.5, (Date.now() - ms) / 3600000);
}

/** YouTube Data API mostPopular (optional YOUTUBE_API_KEY). */
async function collectYouTubeNative(): Promise<TrendItem[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  try {
    const region = (process.env.GOOGLE_TRENDS_GEO || 'IN').trim().toUpperCase().slice(0, 2);
    const geo = collectionGeoRegions(region);
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('chart', 'mostPopular');
    url.searchParams.set('regionCode', region);
    url.searchParams.set('maxResults', '8');
    url.searchParams.set('key', key);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return compactTrends(
      (json.items ?? []).map((item: any, idx: number) => {
        const views = Number(item.statistics?.viewCount || 1000);
        const comments = Number(item.statistics?.commentCount || 50);
        const likes = Number(item.statistics?.likeCount || 100);
        const title = String(item.snippet?.title || `YouTube trend ${idx}`).slice(0, 120);
        const published = item.snippet?.publishedAt as string | undefined;
        const signals = collectYouTubeSignals({
          views_per_hour_1h: Math.round(views / 24),
          views_per_hour_6h: Math.round(views / 12),
          view_growth_speed_pct: 40 + (idx % 5) * 8,
          comment_velocity_15min: Math.max(1, Math.round(comments / 20)),
          comment_velocity_60min: Math.max(2, Math.round(comments / 8)),
          search_volume_rising: true,
          shorts_completion_rate_proxy: 0.6,
          topic_cluster_score: 3 + (idx % 4),
          likes_per_1000_views: likes / Math.max(views / 1000, 1),
          traffic_source_weight: 1.2,
          video_ids_sample: [item.id],
          collected_at: new Date().toISOString(),
        });
        scoreYouTubeSignals(signals, {
          max_views_per_hour: 50000,
          max_view_growth_pct: 200,
          max_comment_velocity: 500,
          max_topic_cluster_score: 20,
          max_likes_per_1000: 200,
        });

        const mentions24h = Math.max(100, Math.round(views / 100));
        return toTrendItem({
          topic: title,
          niche: mapToUiCategory(String(item.snippet?.categoryId || ''), title),
          platforms: ['youtube'],
          creators6h: Math.max(10, Math.round(comments / 15)),
          creators24h: Math.max(30, Math.round(comments / 5)),
          creators72h: Math.max(60, comments),
          mentions24h,
          mentionsPrev24h: estimateMentionsPrev24h(mentions24h),
          ageHours: ageHoursFromIso(published, 6 + idx),
          description: String(item.snippet?.description || '').slice(0, 220),
          hashtags: ['#youtube'],
          geoRegions: geo,
        });
      })
    );
  } catch (err) {
    console.error('YouTube native collector failed', err);
    return [];
  }
}

/** Scrape Creators — trending YouTube Shorts (merged with native mostPopular). */
async function collectYouTubeScrapeCreators(): Promise<TrendItem[]> {
  const { getScrapeCreatorsApiKey, scrapeCreatorsGet } = await import('./scrapeCreators');
  if (!getScrapeCreatorsApiKey()) return [];

  const geo = collectionGeoRegions();
  const result = await scrapeCreatorsGet<{
    shorts?: Array<{
      id?: string;
      title?: string;
      description?: string | null;
      viewCountInt?: number | null;
      likeCountInt?: number | null;
      commentCountInt?: number | null;
      publishDate?: string | null;
      keywords?: string[];
    }>;
  }>('/v1/youtube/shorts/trending', {}, { timeoutMs: 45000 });

  if (!result.ok) {
    console.error('YouTube ScrapeCreators shorts HTTP', result.status, result.error);
    return [];
  }

  const shorts = (result.data.shorts ?? []).slice(0, 12);
  if (!shorts.length) return [];

  return compactTrends(
    shorts.map((item, idx) => {
      const views = Number(item.viewCountInt || 1000);
      const comments = Number(item.commentCountInt || 50);
      const keywords = (item.keywords ?? [])
        .slice(0, 4)
        .map((k) => `#${String(k).replace(/\s+/g, '')}`);
      const mentions24h = Math.max(100, Math.round(views / 100));
      const title = String(item.title || `YouTube Short ${idx}`).slice(0, 120);
      return toTrendItem({
        topic: title,
        niche: mapToUiCategory(keywords.join(' '), title),
        platforms: ['youtube_shorts'],
        creators6h: Math.max(10, Math.round(comments / 15)),
        creators24h: Math.max(30, Math.round(comments / 5)),
        creators72h: Math.max(60, comments),
        mentions24h,
        mentionsPrev24h: estimateMentionsPrev24h(mentions24h),
        ageHours: ageHoursFromIso(item.publishDate, 4 + idx),
        description: String(item.description || item.title || '').slice(0, 220),
        hashtags: keywords.length ? keywords : ['#youtube', '#shorts'],
        geoRegions: geo,
      });
    })
  );
}

/**
 * YouTube trends: native Data API (mostPopular) + Scrape Creators Shorts.
 * Merged and deduped by title — no fabricated rows.
 */
export async function collectYouTubeTrends(): Promise<TrendItem[]> {
  const [native, scrapeCreators] = await Promise.all([
    collectYouTubeNative(),
    collectYouTubeScrapeCreators(),
  ]);
  return mergeTrendsByTitle([...native, ...scrapeCreators]);
}

function mapGoogleTrendRows(items: any[], sourceLabel: string, geo: string[]): TrendItem[] {
  return compactTrends(
    items.slice(0, 8).map((item: any, idx: number) => {
      const title = String(item.query || item.title || item.story_title || `Trend ${idx}`).slice(
        0,
        120
      );
      const growth = Number(
        item.increase_percentage ?? item.percentage_increase ?? item.growth ?? 100 + idx * 10
      );
      const nicheRaw = item.category ?? item.categories?.[0] ?? 'other';
      const niche = Array.isArray(nicheRaw) ? String(nicheRaw[0] || 'other') : String(nicheRaw);
      return toTrendItem({
        topic: title,
        niche: mapToUiCategory(niche, title),
        platforms: ['google'],
        creators6h: 20 + idx * 3,
        creators24h: 60 + idx * 8,
        creators72h: 150 + idx * 12,
        mentions24h: Math.max(100, Math.round(growth * 10)),
        mentionsPrev24h: estimateMentionsPrev24h(Math.max(100, Math.round(growth * 10))),
        ageHours: 2 + idx,
        description: `Rising search interest: ${title}`,
        hashtags: ['#googletrends'],
        geoRegions: geo,
      });
    })
  );
}

/**
 * Google Trends via SERPAPI_KEY (preferred), then SEARCHAPI_KEY / SEARCHAPI_API_KEY
 * (searchapi.io), then GOOGLE_TRENDS_PROXY_URL. Production never fabricates seeds.
 */
export async function collectGoogleTrends(): Promise<TrendItem[]> {
  const geoCode = process.env.GOOGLE_TRENDS_GEO || 'IN';
  const geo = collectionGeoRegions(geoCode);
  const serpKey = process.env.SERPAPI_KEY?.trim();
  if (serpKey) {
    try {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_trends_trending_now');
      url.searchParams.set('geo', geoCode);
      url.searchParams.set('api_key', serpKey);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const items = (data.trending_searches || data.trends || data.news_results || []) as any[];
        if (Array.isArray(items) && items.length) {
          return mapGoogleTrendRows(items, 'SerpAPI', geo);
        }
      } else {
        console.error('SerpAPI Google Trends HTTP', res.status);
      }
    } catch (err) {
      console.error('SerpAPI Google Trends failed', err);
    }
  }

  const searchApiKey = process.env.SEARCHAPI_KEY?.trim() || process.env.SEARCHAPI_API_KEY?.trim();
  if (searchApiKey) {
    try {
      const url = new URL('https://www.searchapi.io/api/v1/search');
      url.searchParams.set('engine', 'google_trends_trending_now');
      url.searchParams.set('geo', geoCode);
      url.searchParams.set('api_key', searchApiKey);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const items = (data.trends || data.trending_searches || data.trending_now || []) as any[];
        if (Array.isArray(items) && items.length) {
          return mapGoogleTrendRows(items, 'SearchAPI.io', geo);
        }
      } else {
        console.error('SearchAPI.io Google Trends HTTP', res.status);
      }
    } catch (err) {
      console.error('SearchAPI.io Google Trends failed', err);
    }
  }

  const proxy = process.env.GOOGLE_TRENDS_PROXY_URL;
  if (proxy) {
    try {
      const res = await fetch(proxy, { next: { revalidate: 300 } });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.trends ?? []);
        return compactTrends(
          items.slice(0, 8).map((item: any, idx: number) => {
            const title = String(item.title || item.query || `Trend ${idx}`);
            const growth = Number(item.growth ?? 120 + idx * 15);
            const signals = collectGoogleTrendsSignals({
              breakout_boolean: Boolean(item.breakout) || growth > 300,
              normalized_growth_pct: growth,
              time_window_4h: Math.min(100, growth / 5),
              time_window_24h: Math.min(100, growth / 4),
              time_window_48h: Math.min(100, growth / 6),
              time_window_7d: Math.min(100, growth / 8),
              active_status: true,
              geo_spread_score: Number(item.geo ?? 40),
              source_surface: 'trending_now',
              category: String(item.niche || 'other'),
              search_type: 'web',
              geo_regions: geo,
              collected_at: new Date().toISOString(),
            });
            scoreGoogleTrendsSignals(signals, {
              max_normalized_growth_pct: 500,
              max_geo_spread_score: 50,
            });
            return toTrendItem({
              topic: title,
              niche: mapToUiCategory(String(item.niche || 'other'), title),
              platforms: ['google'],
              creators6h: 40 + idx * 5,
              creators24h: 120 + idx * 12,
              creators72h: 300 + idx * 20,
              mentions24h: 2000 + idx * 300,
              mentionsPrev24h: estimateMentionsPrev24h(2000 + idx * 300),
              ageHours: 3 + idx,
              geoRegions: geo,
            });
          })
        );
      }
    } catch (err) {
      console.error('Google Trends proxy failed', err);
    }
  }

  // Production: never fabricate Google Trends seeds
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    return [];
  }

  const seeds = [
    { title: 'AI agents for creators', niche: 'AI', growth: 420 },
    { title: 'UPI credit cards India', niche: 'Finance', growth: 280 },
    { title: 'Short-form SEO 2026', niche: 'Startups', growth: 210 },
    { title: 'IPL highlight hooks', niche: 'Fitness', growth: 350 },
    { title: 'Quiet luxury reels', niche: 'Fashion', growth: 160 },
  ];

  return compactTrends(
    seeds.map((s, idx) => {
      collectGoogleTrendsSignals({
        breakout_boolean: s.growth > 300,
        normalized_growth_pct: s.growth,
        time_window_4h: Math.min(100, s.growth / 5),
        time_window_24h: Math.min(100, s.growth / 4),
        time_window_48h: Math.min(100, s.growth / 6),
        time_window_7d: Math.min(100, s.growth / 8),
        active_status: true,
        geo_spread_score: 35 + idx * 8,
        source_surface: 'explore_rising',
        category: s.niche,
        search_type: 'web',
        geo_regions: geo,
        collected_at: new Date().toISOString(),
      });
      return toTrendItem({
        topic: s.title,
        niche: s.niche,
        platforms: ['google'],
        creators6h: 50 + idx * 8,
        creators24h: 140 + idx * 15,
        creators72h: 320 + idx * 25,
        mentions24h: 2500 + s.growth * 4,
        mentionsPrev24h: estimateMentionsPrev24h(2500 + s.growth * 4),
        ageHours: 2 + idx,
        hashtags: [`#${s.niche.replace(/\s+/g, '')}`, '#trends'],
        geoRegions: geo,
      });
    })
  );
}

export async function collectInstagramTrends(): Promise<TrendItem[]> {
  // Prefer ScrapeCreators public trending reels (no IG Business Account required)
  const { getScrapeCreatorsApiKey, scrapeCreatorsGet } = await import('./scrapeCreators');
  if (getScrapeCreatorsApiKey()) {
    const result = await scrapeCreatorsGet<{
      reels?: Array<{
        caption?: string;
        like_count?: number;
        comment_count?: number;
        play_count?: number;
        ig_play_count?: number;
        shortcode?: string;
        user?: { username?: string };
      }>;
      data?: { reels?: unknown[] };
    }>('/v1/instagram/reels/trending', {}, { timeoutMs: 60000 });

    if (!result.ok) {
      console.error('Instagram ScrapeCreators trending HTTP', result.status, result.error);
    } else {
      const reels = (result.data.reels || result.data.data?.reels || []) as Array<{
        caption?: string;
        like_count?: number;
        comment_count?: number;
        play_count?: number;
        ig_play_count?: number;
        shortcode?: string;
        user?: { username?: string };
      }>;
      if (reels.length) {
        const geo = collectionGeoRegions();
        return compactTrends(
          reels.slice(0, 8).map((item, idx) => {
            const plays = Number(item.play_count ?? item.ig_play_count ?? 0);
            const likes = Number(item.like_count ?? 0);
            const comments = Number(item.comment_count ?? 0);
            const caption = String(item.caption || '').trim();
            const topic =
              caption.split('\n')[0]?.slice(0, 100) ||
              (item.user?.username
                ? `IG reel @${item.user.username}`
                : `Instagram reel ${idx + 1}`);
            const mentions24h = Math.max(50, likes || Math.round(plays / 100) || 50);
            return toTrendItem({
              topic: topic.slice(0, 120),
              niche: mapToUiCategory(caption, topic),
              platforms: ['instagram'],
              creators6h: Math.max(5, Math.round(comments / 4) || 5),
              creators24h: Math.max(15, Math.round(comments / 2) || 15),
              creators72h: Math.max(30, comments || 30),
              mentions24h,
              mentionsPrev24h: estimateMentionsPrev24h(mentions24h),
              ageHours: 1 + idx,
              description: 'Trending Instagram reel',
              hashtags: ['#instagram', '#reels'],
              geoRegions: geo,
            });
          })
        );
      }
      console.warn('Instagram trending: empty reels array');
    }
  }

  // Fallback: Meta Graph (requires Business IG linked to a Page)
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return [];

  try {
    // Prefer explicit IG user id; else resolve via linked Facebook Page → Instagram Business Account
    let igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() || '';
    if (!igUserId) {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(token)}`,
        { cache: 'no-store' }
      );
      if (pagesRes.ok) {
        const pagesJson = (await pagesRes.json()) as {
          data?: Array<{ instagram_business_account?: { id?: string } }>;
        };
        igUserId =
          pagesJson.data?.find((p) => p.instagram_business_account?.id)?.instagram_business_account
            ?.id || '';
      }
    }

    if (!igUserId) {
      console.warn(
        'Instagram collector: token present but no Instagram Business Account linked to a Facebook Page. Set INSTAGRAM_BUSINESS_ACCOUNT_ID or link Page + IG Professional in Meta.'
      );
      return [];
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,like_count,comments_count,timestamp,permalink&limit=8&access_token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      const body = await res.text();
      console.error('Instagram collector HTTP', res.status, body.slice(0, 300));
      return [];
    }
    const data = await res.json();
    const items = (data.data ?? []).slice(0, 8) as Array<{
      caption?: string;
      like_count?: number;
      comments_count?: number;
      timestamp?: string;
    }>;
    if (!items.length) return [];

    const geo = collectionGeoRegions();
    return compactTrends(
      items.map((item, idx) =>
        toTrendItem({
          topic: (item.caption ?? 'Instagram post').slice(0, 80),
          niche: mapToUiCategory(item.caption || 'Fashion'),
          platforms: ['instagram'],
          creators6h: 30 + idx * 5,
          creators24h: 90 + idx * 10,
          creators72h: 200 + idx * 20,
          mentions24h: (item.like_count ?? 500) + idx * 100,
          mentionsPrev24h: Math.max(50, Math.round((item.like_count ?? 500) * 0.4)),
          ageHours: ageHoursFromIso(item.timestamp, 2 + idx),
          description: `Instagram media from connected business account`,
          hashtags: ['#instagram'],
          geoRegions: geo,
        })
      )
    );
  } catch (err) {
    console.error('Instagram collector failed', err);
    return [];
  }
}

export async function collectLinkedInTrends(): Promise<TrendItem[]> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    return [];
  }

  try {
    const res = await fetch(
      'https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:organization:0',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error('LinkedIn API error');
    const data = await res.json();
    const elements = (data.elements ?? []).slice(0, 6);
    const geo = collectionGeoRegions();
    return compactTrends(
      elements.map((_: unknown, idx: number) =>
        toTrendItem({
          topic: `LinkedIn trending topic ${idx + 1}`,
          niche: 'Startups',
          platforms: ['linkedin'],
          creators6h: 20 + idx * 4,
          creators24h: 70 + idx * 8,
          creators72h: 150 + idx * 15,
          mentions24h: 1500 + idx * 200,
          mentionsPrev24h: 600 + idx * 50,
          ageHours: 3 + idx,
          geoRegions: geo,
        })
      )
    );
  } catch (err) {
    console.error('LinkedIn collector failed', err);
    return [];
  }
}

/**
 * X / Twitter trends.
 * ScrapeCreators has no /twitter/trends endpoint — only profile/tweets/community.
 * Path: SCRAPECREATORS_API_KEY → Google Search (getdaytrends SERP) + public getdaytrends HTML.
 */
export async function collectTwitterTrends(): Promise<TrendItem[]> {
  const { getScrapeCreatorsApiKey, scrapeCreatorsGet, parseTrendTokensFromText } =
    await import('./scrapeCreators');
  const scKey = getScrapeCreatorsApiKey();
  const bearer = process.env.TWITTER_BEARER_TOKEN?.trim();
  if (!scKey && !bearer) return [];

  if (bearer) {
    console.info(
      'Twitter collector: TWITTER_BEARER_TOKEN present; official Trends API not wired — using getdaytrends path'
    );
  }

  const topics: string[] = [];
  const geoEnv = (process.env.SCRAPECREATORS_TWITTER_GEO || '').trim();
  const trendsGeo = (process.env.GOOGLE_TRENDS_GEO || 'IN').toUpperCase();
  // Map IN → india, US → united-states, etc. Override with SCRAPECREATORS_TWITTER_GEO.
  const countryPath =
    geoEnv ||
    ({
      IN: 'india',
      US: 'united-states',
      GB: 'united-kingdom',
      UK: 'united-kingdom',
      CA: 'canada',
      AU: 'australia',
    }[trendsGeo] ??
      'india');

  if (scKey) {
    const result = await scrapeCreatorsGet<{
      results?: Array<{ title?: string; description?: string; url?: string }>;
    }>(
      '/v1/google/search',
      { query: `site:getdaytrends.com/${countryPath}`, region: trendsGeo.slice(0, 2) },
      { timeoutMs: 45000 }
    );

    if (!result.ok) {
      console.error('Twitter ScrapeCreators google/search HTTP', result.status, result.error);
    } else {
      for (const row of result.data.results || []) {
        const blob = `${row.title || ''} ${row.description || ''}`;
        for (const t of parseTrendTokensFromText(blob, 12)) {
          topics.push(t.replace(/^#/, ''));
        }
        const hot = blob.match(/HOT RIGHT NOW:\s*([^.]+)/i);
        if (hot?.[1]) {
          for (const part of hot[1].split(/,/)) {
            const t = part.trim().replace(/^#/, '');
            if (t.length >= 2 && t.length <= 80) topics.push(t);
          }
        }
        const m = String(row.url || '').match(/\/trend\/([^/?#]+)/i);
        if (m?.[1]) {
          try {
            const decoded = decodeURIComponent(m[1]).replace(/^#/, '').trim();
            if (decoded.length >= 2 && decoded.length <= 80) topics.push(decoded);
          } catch {
            /* ignore */
          }
        }
      }
    }
  }

  // Live HTML fallback (public aggregator — same class as Reddit JSON)
  if (topics.length < 6) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`https://getdaytrends.com/${countryPath}/`, {
        headers: {
          'User-Agent': 'NemoTrends/1.0 (trend intelligence; contact: support@nemo.app)',
          Accept: 'text/html',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const html = await res.text();
        const noise = /^(collapsible|moreTrends|about|terms|4b)$/i;
        for (const m of html.matchAll(/href="\/[^"]*\/trend\/([^"/]+)\//gi)) {
          try {
            const decoded = decodeURIComponent(m[1]).replace(/^#/, '').trim();
            if (decoded.length >= 2 && decoded.length <= 80 && !noise.test(decoded)) {
              topics.push(decoded);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.error('Twitter getdaytrends HTML fallback failed', err);
    }
  }

  const unique = [
    ...new Set(
      topics
        .map((t) => t.replace(/\s+/g, ' ').trim())
        .filter((t) => t.length >= 2 && !/^[A-D]\.\s/i.test(t))
    ),
  ].slice(0, 12);

  if (!unique.length) {
    console.warn(
      'Twitter collector: no topics (ScrapeCreators has no /twitter/trends; getdaytrends empty)'
    );
    return [];
  }

  return compactTrends(
    unique.map((topic, idx) => {
      const tag = topic.startsWith('#') ? topic : `#${topic.replace(/\s+/g, '')}`;
      const mentions24h = 800 + (12 - idx) * 90;
      const clean = topic.replace(/^#/, '').slice(0, 120);
      return toTrendItem({
        topic: clean,
        niche: mapToUiCategory(clean),
        platforms: ['twitter'],
        creators6h: 20 + idx * 3,
        creators24h: 60 + idx * 8,
        creators72h: 140 + idx * 12,
        mentions24h,
        mentionsPrev24h: estimateMentionsPrev24h(mentions24h),
        ageHours: 1 + idx * 0.4,
        description: `Trending on X right now`,
        hashtags: [tag, '#twitter'],
        geoRegions: collectionGeoRegions(trendsGeo),
      });
    })
  );
}

/** TikTok — ScrapeCreators trending feed (region required). */
export async function collectTikTokTrends(): Promise<TrendItem[]> {
  const { getScrapeCreatorsApiKey, scrapeCreatorsGet } = await import('./scrapeCreators');
  if (!getScrapeCreatorsApiKey()) {
    const key = process.env.TIKTOK_CLIENT_KEY?.trim();
    if (key) {
      console.info(
        'TikTok collector: TIKTOK_CLIENT_KEY present but partner Trends API not wired; set SCRAPECREATORS_API_KEY'
      );
    }
    return [];
  }

  const region = (process.env.SCRAPECREATORS_TIKTOK_REGION || process.env.GOOGLE_TRENDS_GEO || 'IN')
    .trim()
    .toUpperCase()
    .slice(0, 2);

  const result = await scrapeCreatorsGet<{
    aweme_list?: Array<{
      desc?: string;
      create_time?: number;
      statistics?: {
        play_count?: number;
        digg_count?: number;
        comment_count?: number;
        share_count?: number;
      };
      author?: { nickname?: string; unique_id?: string };
      aweme_id?: string;
    }>;
  }>('/v1/tiktok/get-trending-feed', { region, trim: true }, { timeoutMs: 60000 });

  if (!result.ok) {
    console.error('TikTok ScrapeCreators trending HTTP', result.status, result.error);
    return [];
  }

  const list = result.data.aweme_list || [];
  if (!list.length) {
    console.warn('TikTok ScrapeCreators trending: empty aweme_list');
    return [];
  }

  return compactTrends(
    list.slice(0, 8).map((item, idx) => {
      const plays = Number(item.statistics?.play_count ?? 0);
      const likes = Number(item.statistics?.digg_count ?? 0);
      const comments = Number(item.statistics?.comment_count ?? 0);
      const desc = String(item.desc || '').trim();
      const topic =
        desc.split(/[#\n]/)[0]?.trim().slice(0, 100) ||
        (item.author?.nickname
          ? `TikTok @${item.author.unique_id || item.author.nickname}`
          : `TikTok trend ${idx + 1}`);
      const hashtags = Array.from(desc.matchAll(/#([\w]+)/g))
        .slice(0, 3)
        .map((m) => `#${m[1]}`);
      const mentions24h = Math.max(100, Math.round(plays / 500) || likes || 100);
      const ageHours = item.create_time
        ? Math.max(0.5, (Date.now() / 1000 - item.create_time) / 3600)
        : 2 + idx;
      return toTrendItem({
        topic: topic.slice(0, 120) || `TikTok trend ${idx + 1}`,
        niche: mapToUiCategory(desc, topic),
        platforms: ['tiktok'],
        creators6h: Math.max(8, Math.round(comments / 10) || 8),
        creators24h: Math.max(25, Math.round(comments / 3) || 25),
        creators72h: Math.max(50, comments || 50),
        mentions24h,
        mentionsPrev24h: estimateMentionsPrev24h(mentions24h),
        ageHours,
        description: `Trending on TikTok right now`,
        hashtags: hashtags.length ? hashtags : ['#tiktok'],
        geoRegions: collectionGeoRegions(region),
      });
    })
  );
}

/**
 * Facebook — ScrapeCreators has no native trending-topics endpoint.
 * Collect recent high-view public page reels (configurable page URLs).
 */
export async function collectFacebookTrends(): Promise<TrendItem[]> {
  const { getScrapeCreatorsApiKey, scrapeCreatorsGet } = await import('./scrapeCreators');
  if (!getScrapeCreatorsApiKey()) return [];

  const pagesRaw =
    process.env.FACEBOOK_TREND_PAGE_URLS?.trim() ||
    'https://www.facebook.com/whatstrending,https://www.facebook.com/CNN';
  const pages = pagesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  type FbReel = {
    description?: string;
    view_count?: number | null;
    creation_time?: string;
    url?: string;
    post_id?: string;
  };

  const all: FbReel[] = [];
  for (const pageUrl of pages) {
    const result = await scrapeCreatorsGet<{ reels?: FbReel[] }>(
      '/v1/facebook/profile/reels',
      { url: pageUrl },
      { timeoutMs: 60000 }
    );
    if (!result.ok) {
      console.error('Facebook ScrapeCreators reels HTTP', result.status, pageUrl, result.error);
      continue;
    }
    const reels = result.data.reels || [];
    if (!reels.length) {
      console.warn('Facebook ScrapeCreators reels empty for', pageUrl);
      continue;
    }
    all.push(...reels);
  }

  if (!all.length) {
    console.warn(
      'Facebook collector: no reels returned. ScrapeCreators has no /facebook/trending endpoint; set FACEBOOK_TREND_PAGE_URLS to public page URLs.'
    );
    return [];
  }

  const ranked = [...all].sort((a, b) => Number(b.view_count || 0) - Number(a.view_count || 0));
  const geo = collectionGeoRegions();
  return compactTrends(
    ranked.slice(0, 8).map((item, idx) => {
      const views = Number(item.view_count || 0);
      const desc = String(item.description || '').trim();
      const topic = desc.split('\n')[0]?.slice(0, 100) || `Facebook reel ${idx + 1}`;
      const mentions24h = Math.max(80, Math.round(views / 50) || 80);
      const ageHours = item.creation_time
        ? Math.max(0.5, (Date.now() - new Date(item.creation_time).getTime()) / 3600000)
        : 2 + idx;
      return toTrendItem({
        topic: topic.slice(0, 120),
        niche: mapToUiCategory(desc, topic),
        platforms: ['facebook'],
        creators6h: 10 + idx * 2,
        creators24h: 30 + idx * 5,
        creators72h: 80 + idx * 8,
        mentions24h,
        mentionsPrev24h: estimateMentionsPrev24h(mentions24h),
        ageHours,
        description: `Trending on Facebook right now`,
        hashtags: ['#facebook'],
        geoRegions: geo,
      });
    })
  );
}

export async function collectMvpTrends(): Promise<TrendItem[]> {
  const result = await collectMvpTrendsDetailed();
  return result.trends;
}

export type ProviderCollectStat = {
  platform: string;
  count: number;
  error: string | null;
  startedAt: string;
  finishedAt: string;
};

async function runProvider(
  platform: string,
  fn: () => Promise<TrendItem[]>
): Promise<{ items: TrendItem[]; stat: ProviderCollectStat }> {
  const startedAt = new Date().toISOString();
  console.info(`[ingest] ${platform} started`);
  try {
    const items = await fn();
    const finishedAt = new Date().toISOString();
    console.info(`[ingest] ${platform} count=${items.length}`);
    return {
      items,
      stat: { platform, count: items.length, error: null, startedAt, finishedAt },
    };
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const message = err instanceof Error ? err.message : 'collector failed';
    console.error(`[ingest] ${platform} failed`, message);
    return {
      items: [],
      stat: { platform, count: 0, error: message, startedAt, finishedAt },
    };
  }
}

export async function collectMvpTrendsDetailed(): Promise<{
  trends: TrendItem[];
  stats: ProviderCollectStat[];
}> {
  const results = await Promise.all([
    runProvider('reddit', collectRedditTrends),
    runProvider('youtube', collectYouTubeTrends),
    runProvider('google_trends', collectGoogleTrends),
    runProvider('instagram', collectInstagramTrends),
    runProvider('linkedin', collectLinkedInTrends),
    runProvider('twitter', collectTwitterTrends),
    runProvider('tiktok', collectTikTokTrends),
    runProvider('facebook', collectFacebookTrends),
  ]);

  const stats = results.map((r) => r.stat);
  const merged = results.flatMap((r) => r.items);
  const byTitle = new Map<string, TrendItem>();
  for (const t of merged) {
    const key = t.title.toLowerCase();
    const existing = byTitle.get(key);
    if (!existing || t.nemoScore > existing.nemoScore) byTitle.set(key, t);
  }

  const trends = [...byTitle.values()].sort((a, b) => b.nemoScore - a.nemoScore);
  console.info(`[ingest] merged total=${trends.length}`);
  return { trends, stats };
}
