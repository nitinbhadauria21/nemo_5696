/**
 * Scrape Creators API client for trend collectors.
 * Docs: https://docs.scrapecreators.com — auth via x-api-key header.
 * Env: SCRAPE_CREATORS_API_KEY (never commit the key).
 */

export const SCRAPE_CREATORS_BASE = 'https://api.scrapecreators.com';

export function getScrapeCreatorsApiKey(): string | null {
  return process.env.SCRAPE_CREATORS_API_KEY?.trim() || null;
}

export async function scrapeCreatorsGet<T = unknown>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T | null> {
  const apiKey = getScrapeCreatorsApiKey();
  if (!apiKey) return null;

  const url = new URL(path.startsWith('http') ? path : `${SCRAPE_CREATORS_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('ScrapeCreators HTTP', path, res.status, body.slice(0, 240));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error('ScrapeCreators fetch failed', path, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type ScYoutubeShort = {
  id?: string;
  title?: string;
  description?: string | null;
  viewCountInt?: number | null;
  likeCountInt?: number | null;
  commentCountInt?: number | null;
  publishDate?: string | null;
  keywords?: string[];
  channel?: { title?: string; handle?: string };
};

export type ScTikTokAweme = {
  aweme_id?: string;
  desc?: string;
  region?: string;
  create_time?: number;
  create_time_utc?: string;
  url?: string;
  statistics?: {
    play_count?: number;
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
  };
  author?: { unique_id?: string; nickname?: string };
  image_post_info?: { title?: string };
};

export type ScTweet = {
  id?: string;
  text?: string;
  full_text?: string;
  created_at?: string;
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
  quote_count?: number;
  views?: number | string;
  entities?: { hashtags?: Array<{ text?: string }> };
};

export function extractHashtags(text: string): string[] {
  const tags = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(tags.map((t) => t.slice(1)).filter(Boolean))];
}

/** Pull distinct topic-like lines from trend-bot tweet text. */
export function topicsFromTrendBotText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const topics: string[] = [];
  const hashtags = extractHashtags(cleaned);
  for (const h of hashtags) {
    if (h.length >= 2 && h.length <= 60) topics.push(h.replace(/_/g, ' '));
  }

  // Numbered lists: "1. Topic" / "1) Topic" / "1 - Topic"
  for (const m of cleaned.matchAll(/(?:^|\s)(?:\d{1,2}[.)\]:-]\s+)([^\n|#]{3,80})/g)) {
    const t = m[1].replace(/https?:\/\/\S+/g, '').trim();
    if (t.length >= 3) topics.push(t);
  }

  // Quoted phrases
  for (const m of cleaned.matchAll(/"([^"]{3,80})"/g)) {
    topics.push(m[1].trim());
  }

  return [...new Set(topics.map((t) => t.replace(/^[#@]+/, '').trim()).filter((t) => t.length >= 3))].slice(
    0,
    12
  );
}
