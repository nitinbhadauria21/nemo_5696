/**
 * Reddit OAuth client for trend collection.
 *
 * Uses client_credentials grant against oauth.reddit.com (~55 min in-memory token cache).
 * Falls back to public .json URLs when OAuth creds are absent (local dev only —
 * production will receive 403 from datacenter IPs and log a clear error).
 */

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID?.trim() ?? '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET?.trim() ?? '';
const REDDIT_USER_AGENT =
  process.env.REDDIT_USER_AGENT?.trim() ??
  'NemoTrends/1.2 (by /u/nemo; contact@nemo.app)';

/** Reddit OAuth tokens last 60 min; we refresh 5 min early. */
const TOKEN_TTL_MS = 55 * 60 * 1000;

interface TokenCache {
  token: string;
  expiresAt: number;
}

let _tokenCache: TokenCache | null = null;

/** Returns true when REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are both present. */
export function isRedditOAuthConfigured(): boolean {
  return Boolean(REDDIT_CLIENT_ID && REDDIT_CLIENT_SECRET);
}

/**
 * Obtain a Reddit app-only OAuth token using the client_credentials grant.
 * Result is cached in-process for ~55 min.
 */
export async function getRedditAccessToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  if (!isRedditOAuthConfigured()) {
    throw new Error(
      'Reddit OAuth not configured: set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables'
    );
  }

  const credentials = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString(
    'base64'
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'User-Agent': REDDIT_USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`Reddit token fetch failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('Reddit token response missing access_token field');
  }

  _tokenCache = { token: data.access_token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return _tokenCache.token;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  created_utc: number;
  permalink: string;
  score: number;
  num_comments: number;
  upvote_ratio: number;
  subreddit_subscribers: number;
  over_18: boolean;
  link_flair_text: string | null;
}

export interface RedditComment {
  id: string;
  body: string;
  score: number;
  author: string;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseRedditPost(raw: Record<string, unknown>): RedditPost {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? '').slice(0, 300),
    subreddit: String(raw.subreddit ?? ''),
    author: String(raw.author ?? ''),
    created_utc: typeof raw.created_utc === 'number' ? raw.created_utc : Date.now() / 1000,
    permalink: String(raw.permalink ?? ''),
    score: typeof raw.score === 'number' ? raw.score : 0,
    num_comments: typeof raw.num_comments === 'number' ? raw.num_comments : 0,
    upvote_ratio: typeof raw.upvote_ratio === 'number' ? raw.upvote_ratio : 0.5,
    subreddit_subscribers:
      typeof raw.subreddit_subscribers === 'number' ? raw.subreddit_subscribers : 0,
    over_18: Boolean(raw.over_18),
    link_flair_text: raw.link_flair_text != null ? String(raw.link_flair_text) : null,
  };
}

function extractPostsFromListing(json: unknown): RedditPost[] {
  if (
    !json ||
    typeof json !== 'object' ||
    !('data' in json) ||
    !(json as { data?: unknown }).data ||
    typeof (json as { data: unknown }).data !== 'object'
  ) {
    return [];
  }
  const listing = (json as { data: { children?: unknown } }).data;
  if (!Array.isArray(listing.children)) return [];
  return listing.children
    .filter(
      (c): c is { kind: string; data: Record<string, unknown> } =>
        Boolean(c && typeof c === 'object' && 'data' in c)
    )
    .map((c) => parseRedditPost(c.data));
}

function extractComments(json: unknown, limit: number): RedditComment[] {
  if (!Array.isArray(json) || json.length < 2) return [];
  const commentListing = json[1];
  if (
    !commentListing ||
    typeof commentListing !== 'object' ||
    !('data' in commentListing) ||
    !(commentListing as { data?: unknown }).data ||
    typeof (commentListing as { data: unknown }).data !== 'object'
  ) {
    return [];
  }
  const listing = (commentListing as { data: { children?: unknown } }).data;
  if (!Array.isArray(listing.children)) return [];
  return listing.children
    .filter(
      (c): c is { kind: string; data: Record<string, unknown> } =>
        Boolean(
          c &&
            typeof c === 'object' &&
            'data' in c &&
            (c as { kind?: string }).kind === 't1'
        )
    )
    .slice(0, limit)
    .map((c) => ({
      id: String(c.data.id ?? ''),
      body: String(c.data.body ?? '').slice(0, 500),
      score: typeof c.data.score === 'number' ? c.data.score : 0,
      author: String(c.data.author ?? ''),
    }));
}

// ---------------------------------------------------------------------------
// Internal fetchers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOAuthListing(
  subreddit: string,
  sort: string,
  limit: number,
  token: string
): Promise<RedditPost[]> {
  const url = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/${encodeURIComponent(sort)}?limit=${limit}&raw_json=1`;
  const res = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': REDDIT_USER_AGENT,
    },
  });
  if (!res.ok) {
    throw new Error(`Reddit OAuth listing failed: HTTP ${res.status} (${url})`);
  }
  return extractPostsFromListing(await res.json());
}

async function fetchPublicListing(
  subreddit: string,
  sort: string,
  limit: number
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/${encodeURIComponent(sort)}.json?limit=${limit}&raw_json=1`;
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': REDDIT_USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Reddit public listing failed: HTTP ${res.status} (${url})`);
  }
  return extractPostsFromListing(await res.json());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a Reddit listing. Uses OAuth when creds are configured, falls back to
 * public .json otherwise (local dev only; production requires OAuth).
 *
 * @param subreddit  e.g. "popular" or "all"
 * @param sort       "hot" | "rising" | "new" | "top"
 * @param limit      number of posts to return (max 100)
 */
export async function fetchRedditListing(
  subreddit: string,
  sort: string,
  limit: number
): Promise<RedditPost[]> {
  if (isRedditOAuthConfigured()) {
    const token = await getRedditAccessToken();
    return fetchOAuthListing(subreddit, sort, limit, token);
  }
  return fetchPublicListing(subreddit, sort, limit);
}

/**
 * Fetch top-level comments for a Reddit post.
 * Uses OAuth when configured, public API otherwise.
 *
 * @param postId  Reddit post ID (e.g. "abc123")
 * @param limit   maximum number of top-level comments to return
 */
export async function fetchPostComments(postId: string, limit: number): Promise<RedditComment[]> {
  const path = `/comments/${encodeURIComponent(postId)}?limit=${limit}&depth=1&raw_json=1`;

  if (isRedditOAuthConfigured()) {
    const token = await getRedditAccessToken();
    const res = await fetchWithTimeout(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });
    if (!res.ok) throw new Error(`Reddit OAuth comments failed: HTTP ${res.status}`);
    return extractComments(await res.json(), limit);
  }

  const res = await fetchWithTimeout(`https://www.reddit.com${path}`, {
    headers: {
      'User-Agent': REDDIT_USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Reddit public comments failed: HTTP ${res.status}`);
  return extractComments(await res.json(), limit);
}
