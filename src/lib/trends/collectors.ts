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

function hashId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return `trend-${Math.abs(h).toString(16)}`;
}

function statusFromNemo(score: number): TrendStatus {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'rising';
  return 'fading';
}

function timeAgoFromHours(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function mapUiPlatforms(platforms: TrendPlatform[]): Platform[] {
  return platforms.map((p) => (p === 'google' ? 'google_trends' : p));
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
}): TrendItem {
  const firstDetectedAt = new Date(Date.now() - input.ageHours * 3600 * 1000).toISOString();
  const score = computeFullNemoScore({
    creatorVelocityInputs: {
      creators_last_6h: input.creators6h,
      creators_last_24h: input.creators24h,
      creators_last_72h: input.creators72h,
      historical_max_velocity_for_platform: Math.max(input.creators24h * 1.2, 100),
    },
    spikeInputs: {
      mentions_last_24h: input.mentions24h,
      mentions_prev_24h: Math.max(input.mentionsPrev24h, 10),
    },
    crossPlatformInputs: {
      platforms_present: mapUiPlatforms(input.platforms),
    },
    freshnessInputs: {
      first_detected_at: firstDetectedAt,
      now: new Date().toISOString(),
    },
  });

  const spark = Array.from({ length: 9 }, (_, i) =>
    Math.max(5, Math.min(100, Math.round(score.nemo_score * (0.4 + i * 0.07) + (i % 3) * 4)))
  );

  return {
    id: hashId(input.topic),
    title: input.topic,
    category: input.niche,
    status: statusFromNemo(score.nemo_score),
    nemoScore: Math.round(score.nemo_score),
    cvs: Math.round(score.creator_velocity_score),
    ss: Math.round(score.spike_score),
    cps: Math.round(score.cross_platform_score),
    freshness: Math.round(score.freshness_score),
    freshnessMultiplier: score.freshness_multiplier,
    platforms: input.platforms,
    creatorsCount: input.creators72h,
    mentions24h: input.mentions24h,
    mentionsPrev24h: input.mentionsPrev24h,
    creatorsLast6h: input.creators6h,
    creatorsLast24h: input.creators24h,
    creatorsLast72h: input.creators72h,
    sparklineData: spark,
    timeAgo: timeAgoFromHours(input.ageHours),
    firstDetectedAt,
    hashtags: input.hashtags ?? [`#${input.topic.replace(/\s+/g, '')}`],
    description:
      input.description ??
      `${input.topic} is accelerating across ${input.platforms.join(', ')} with rising creator velocity.`,
    isBookmarked: false,
    velocity: Number((input.mentions24h / Math.max(input.mentionsPrev24h, 1)).toFixed(2)),
    spike: Number((input.mentions24h / Math.max(input.mentionsPrev24h, 1)).toFixed(2)),
    contentType: 'TOPIC',
  };
}

/** Reddit public JSON — no API key required */
export async function collectRedditTrends(): Promise<TrendItem[]> {
  try {
    const res = await fetch('https://www.reddit.com/r/popular/hot.json?limit=12', {
      headers: { 'User-Agent': 'nemo-trends/1.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.children ?? [];
    return posts.slice(0, 8).map((child: any, idx: number) => {
      const p = child.data;
      const score = typeof p.score === 'number' ? p.score : 100;
      const comments = typeof p.num_comments === 'number' ? p.num_comments : 10;
      const signals = collectRedditSignals({
        score_velocity_5min: Math.max(1, Math.round(score / 40)),
        score_velocity_15min: Math.max(1, Math.round(score / 25)),
        score_velocity_60min: Math.max(1, Math.round(score / 10)),
        comment_velocity: Math.max(1, Math.round(comments / 8)),
        cross_subreddit_count: 1,
        sort_positions: ['hot', 'rising'],
        post_age_hours: Math.max(
          0.5,
          (Date.now() / 1000 - (p.created_utc || Date.now() / 1000)) / 3600
        ),
        subreddit_subscriber_count: 100000,
        upvote_ratio: p.upvote_ratio ?? 0.9,
        nsfw_flag: Boolean(p.over_18),
        subreddit_names: [p.subreddit],
        post_ids_sample: [p.id],
        collected_at: new Date().toISOString(),
      });
      scoreRedditSignals(signals, { max_score_velocity: 200, max_comment_velocity: 100 });

      return toTrendItem({
        topic: String(p.title || `Reddit trend ${idx}`).slice(0, 120),
        niche: 'other',
        platforms: ['reddit', 'google'],
        creators6h: Math.max(5, Math.round(comments / 8)),
        creators24h: Math.max(20, Math.round(comments / 2)),
        creators72h: Math.max(40, comments),
        mentions24h: Math.max(50, score),
        mentionsPrev24h: Math.max(20, Math.round(score * 0.4)),
        ageHours: Math.max(1, (Date.now() / 1000 - (p.created_utc || Date.now() / 1000)) / 3600),
        description: `Trending on r/${p.subreddit}: ${String(p.title || '').slice(0, 160)}`,
        hashtags: [`#${p.subreddit}`, '#reddit'],
      });
    });
  } catch (err) {
    console.error('Reddit collector failed', err);
    return [];
  }
}

/** YouTube Data API (optional YOUTUBE_API_KEY) */
export async function collectYouTubeTrends(): Promise<TrendItem[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('chart', 'mostPopular');
    url.searchParams.set('regionCode', 'IN');
    url.searchParams.set('maxResults', '8');
    url.searchParams.set('key', key);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items ?? []).map((item: any, idx: number) => {
      const views = Number(item.statistics?.viewCount || 1000);
      const comments = Number(item.statistics?.commentCount || 50);
      const likes = Number(item.statistics?.likeCount || 100);
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

      return toTrendItem({
        topic: String(item.snippet?.title || `YouTube trend ${idx}`).slice(0, 120),
        niche: 'AI',
        platforms: ['youtube', 'google'],
        creators6h: Math.max(10, Math.round(comments / 15)),
        creators24h: Math.max(30, Math.round(comments / 5)),
        creators72h: Math.max(60, comments),
        mentions24h: Math.max(100, Math.round(views / 100)),
        mentionsPrev24h: Math.max(40, Math.round(views / 250)),
        ageHours: 6 + idx,
        description: String(item.snippet?.description || '').slice(0, 220),
        hashtags: ['#youtube', '#shorts'],
      });
    });
  } catch (err) {
    console.error('YouTube collector failed', err);
    return [];
  }
}

/**
 * Google Trends via optional proxy, otherwise scored seed rising queries.
 */
export async function collectGoogleTrends(): Promise<TrendItem[]> {
  const proxy = process.env.GOOGLE_TRENDS_PROXY_URL;
  if (proxy) {
    try {
      const res = await fetch(proxy, { next: { revalidate: 300 } });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.trends ?? []);
        return items.slice(0, 8).map((item: any, idx: number) => {
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
            geo_regions: ['IN'],
            collected_at: new Date().toISOString(),
          });
          scoreGoogleTrendsSignals(signals, {
            max_normalized_growth_pct: 500,
            max_geo_spread_score: 50,
          });
          return toTrendItem({
            topic: title,
            niche: String(item.niche || 'other'),
            platforms: ['google', 'youtube'],
            creators6h: 40 + idx * 5,
            creators24h: 120 + idx * 12,
            creators72h: 300 + idx * 20,
            mentions24h: 2000 + idx * 300,
            mentionsPrev24h: 800 + idx * 50,
            ageHours: 3 + idx,
          });
        });
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
    { title: 'UPI credit cards India', niche: 'finance', growth: 280 },
    { title: 'Short-form SEO 2026', niche: 'marketing', growth: 210 },
    { title: 'IPL highlight hooks', niche: 'sports', growth: 350 },
    { title: 'Quiet luxury reels', niche: 'fashion', growth: 160 },
  ];

  return seeds.map((s, idx) => {
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
      geo_regions: ['IN'],
      collected_at: new Date().toISOString(),
    });
    return toTrendItem({
      topic: s.title,
      niche: s.niche,
      platforms: ['google', 'youtube', 'instagram'],
      creators6h: 50 + idx * 8,
      creators24h: 140 + idx * 15,
      creators72h: 320 + idx * 25,
      mentions24h: 2500 + s.growth * 4,
      mentionsPrev24h: 900 + idx * 80,
      ageHours: 2 + idx,
      hashtags: [`#${s.niche}`, '#trends'],
    });
  });
}

export async function collectInstagramTrends(): Promise<TrendItem[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') return [];
    return [
      toTrendItem({
        topic: 'Reel transitions trend pack',
        niche: 'fashion',
        platforms: ['instagram', 'tiktok'],
        creators6h: 120,
        creators24h: 480,
        creators72h: 1200,
        mentions24h: 8400,
        mentionsPrev24h: 2100,
        ageHours: 4,
        hashtags: ['#reels', '#transition'],
      }),
    ];
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/media?fields=id,caption,like_count,comments_count,timestamp&access_token=${token}`
    );
    if (!res.ok) throw new Error('Instagram API error');
    const data = await res.json();
    const items = (data.data ?? []).slice(0, 8) as Array<{ caption?: string; like_count?: number }>;
    return items.map((item, idx) =>
      toTrendItem({
        topic: (item.caption ?? 'Instagram trend').slice(0, 80),
        niche: 'fashion',
        platforms: ['instagram'],
        creators6h: 30 + idx * 5,
        creators24h: 90 + idx * 10,
        creators72h: 200 + idx * 20,
        mentions24h: (item.like_count ?? 500) + idx * 100,
        mentionsPrev24h: 200 + idx * 40,
        ageHours: 2 + idx,
      })
    );
  } catch (err) {
    console.error('Instagram collector failed', err);
    return [];
  }
}

export async function collectLinkedInTrends(): Promise<TrendItem[]> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') return [];
    return [
      toTrendItem({
        topic: 'AI productivity for founders',
        niche: 'business',
        platforms: ['linkedin'],
        creators6h: 45,
        creators24h: 180,
        creators72h: 420,
        mentions24h: 3200,
        mentionsPrev24h: 900,
        ageHours: 6,
        hashtags: ['#startups', '#AI'],
      }),
    ];
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
    return elements.map((_: unknown, idx: number) =>
      toTrendItem({
        topic: `LinkedIn trending topic ${idx + 1}`,
        niche: 'business',
        platforms: ['linkedin'],
        creators6h: 20 + idx * 4,
        creators24h: 70 + idx * 8,
        creators72h: 150 + idx * 15,
        mentions24h: 1500 + idx * 200,
        mentionsPrev24h: 600 + idx * 50,
        ageHours: 3 + idx,
      })
    );
  } catch (err) {
    console.error('LinkedIn collector failed', err);
    return [];
  }
}

export async function collectMvpTrends(): Promise<TrendItem[]> {
  const [reddit, youtube, google, instagram, linkedin] = await Promise.all([
    collectRedditTrends(),
    collectYouTubeTrends(),
    collectGoogleTrends(),
    collectInstagramTrends(),
    collectLinkedInTrends(),
  ]);

  const merged = [...google, ...youtube, ...reddit, ...instagram, ...linkedin];
  const byTitle = new Map<string, TrendItem>();
  for (const t of merged) {
    const key = t.title.toLowerCase();
    const existing = byTitle.get(key);
    if (!existing || t.nemoScore > existing.nemoScore) byTitle.set(key, t);
  }

  return [...byTitle.values()].sort((a, b) => b.nemoScore - a.nemoScore);
}
