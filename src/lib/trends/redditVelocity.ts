import type { SupabaseClient } from '@supabase/supabase-js';

/** Snapshot of a Reddit post stored in trend_sources.metadata on a prior ingest. */
export interface RedditPostSnapshot {
  external_id: string;
  score: number;
  num_comments: number;
  collected_at: string;
}

/** Computed velocity signals for one Reddit post. */
export interface RedditVelocities {
  /** Score units gained in the last ~5 minutes (projected from actual Δt). */
  score_velocity_5min: number;
  /** Score units gained in the last ~15 minutes. */
  score_velocity_15min: number;
  /** Score units gained in the last ~60 minutes (per-hour rate). */
  score_velocity_60min: number;
  /** Comment delta per hour. */
  comment_velocity: number;
}

/** Current post metrics passed into computeRedditVelocities. */
export interface RedditCurrentMetrics {
  score: number;
  num_comments: number;
  collected_at: string;
}

/**
 * Load the most-recent score/comment snapshot for every Reddit external_id
 * currently stored in trend_sources.
 *
 * Returns a Map keyed by external_id (the Reddit post ID, e.g. "abc123").
 * Only rows that have parseable metadata with score + num_comments + collected_at
 * are included.
 */
export async function loadPriorRedditMetrics(
  supabase: SupabaseClient
): Promise<Map<string, RedditPostSnapshot>> {
  const { data, error } = await supabase
    .from('trend_sources')
    .select('external_id, metadata, collected_at')
    .eq('platform', 'reddit')
    .not('external_id', 'is', null)
    .order('collected_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('loadPriorRedditMetrics: query failed', error.message);
    return new Map();
  }

  const result = new Map<string, RedditPostSnapshot>();
  for (const row of data ?? []) {
    const id = String(row.external_id ?? '').trim();
    if (!id || result.has(id)) continue;

    const meta = row.metadata as Record<string, unknown> | null;
    const score = Number(meta?.score);
    const num_comments = Number(meta?.num_comments);
    const collected_at = String(meta?.collected_at ?? row.collected_at ?? '');

    if (!Number.isFinite(score) || !Number.isFinite(num_comments) || !collected_at) continue;

    result.set(id, { external_id: id, score, num_comments, collected_at });
  }

  return result;
}

/**
 * Compute Reddit velocity signals by diffing current metrics against a prior snapshot.
 *
 * Velocity windows assume a linear growth rate between the two observations.
 * Velocities are floored at 0 (no negative velocity returned).
 * Returns null when the time delta is < 10 seconds (avoids division by near-zero).
 */
export function computeRedditVelocities(
  current: RedditCurrentMetrics,
  prior: RedditPostSnapshot
): RedditVelocities | null {
  const nowMs = Date.parse(current.collected_at);
  const priorMs = Date.parse(prior.collected_at);
  if (!Number.isFinite(nowMs) || !Number.isFinite(priorMs)) return null;

  const deltaMs = nowMs - priorMs;
  if (deltaMs < 10_000) return null;

  const deltaHours = deltaMs / 3_600_000;

  const scorePerHour = Math.max(0, current.score - prior.score) / deltaHours;
  const commentPerHour = Math.max(0, current.num_comments - prior.num_comments) / deltaHours;

  return {
    score_velocity_5min: Math.round(scorePerHour * (5 / 60)),
    score_velocity_15min: Math.round(scorePerHour * (15 / 60)),
    score_velocity_60min: Math.round(scorePerHour),
    comment_velocity: Math.round(commentPerHour),
  };
}

// ---------------------------------------------------------------------------
// Cross-subreddit clustering
// ---------------------------------------------------------------------------

const CLUSTER_STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'has',
  'have',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'not',
  'no',
  'nor',
  'so',
  'yet',
  'both',
  'as',
  'if',
  'up',
  'out',
  'about',
  'after',
  'before',
  'over',
  'under',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'he',
  'she',
  'they',
  'we',
  'i',
  'you',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'our',
  'their',
  'what',
  'who',
  'how',
  'when',
  'where',
  'why',
  'which',
  'vs',
  'via',
  'new',
  'just',
  'more',
  'like',
]);

/** Minimum token length to participate in cluster key hashing. */
const MIN_TOKEN_LEN = 3;

/**
 * Normalise a post title into a sorted set of meaningful tokens.
 * Used to detect cross-subreddit duplicates of the same story.
 */
export function normalizeTitleTokens(title: string): string[] {
  return [
    ...new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= MIN_TOKEN_LEN && !CLUSTER_STOPWORDS.has(t))
    ),
  ].sort();
}

/** A Reddit post entry used for clustering. */
export interface RedditClusterInput {
  external_id: string;
  title: string;
  subreddit: string;
}

/** Result of clustering: cluster key → distinct subreddits. */
export type CrossSubredditClusters = Map<string, Set<string>>;

/**
 * Group posts by shared title tokens and count distinct subreddits per cluster.
 *
 * Two posts share a cluster when they have at least `minSharedTokens` tokens in
 * common.  The cluster key is the sorted intersection of the two longest token
 * sets for each pair — deterministic and cheap at the scale of a single ingest
 * batch (typically < 200 posts).
 *
 * Returns a Map from a canonical cluster key string to the set of distinct
 * subreddit names present in that cluster.
 */
export function clusterByTitle(
  posts: RedditClusterInput[],
  minSharedTokens = 2
): CrossSubredditClusters {
  const tokenSets: Array<{ id: string; subreddit: string; tokens: Set<string>; key: string }> =
    posts.map((p) => {
      const tokens = new Set(normalizeTitleTokens(p.title));
      return { id: p.external_id, subreddit: p.subreddit, tokens, key: p.external_id };
    });

  const clusterOf = new Map<string, string>();
  const clusterSubreddits = new Map<string, Set<string>>();

  const getRoot = (id: string): string => {
    let cur = id;
    while (clusterOf.get(cur) !== cur && clusterOf.has(cur)) {
      cur = clusterOf.get(cur)!;
    }
    return cur;
  };

  for (let i = 0; i < tokenSets.length; i++) {
    const a = tokenSets[i];
    if (!clusterOf.has(a.id)) {
      clusterOf.set(a.id, a.id);
    }
    for (let j = i + 1; j < tokenSets.length; j++) {
      const b = tokenSets[j];
      if (!clusterOf.has(b.id)) {
        clusterOf.set(b.id, b.id);
      }
      let shared = 0;
      for (const t of a.tokens) {
        if (b.tokens.has(t)) shared++;
        if (shared >= minSharedTokens) break;
      }
      if (shared < minSharedTokens) continue;
      const ra = getRoot(a.id);
      const rb = getRoot(b.id);
      if (ra !== rb) {
        clusterOf.set(rb, ra);
      }
    }
  }

  for (const entry of tokenSets) {
    const root = getRoot(entry.id);
    if (!clusterSubreddits.has(root)) {
      clusterSubreddits.set(root, new Set());
    }
    clusterSubreddits.get(root)!.add(entry.subreddit.toLowerCase());
  }

  return clusterSubreddits;
}

/**
 * Given an external_id return the number of distinct subreddits in its cluster.
 * Returns 1 when the post is not clustered with any other post.
 */
export function crossSubredditCount(
  externalId: string,
  posts: RedditClusterInput[],
  clusters: CrossSubredditClusters
): number {
  const tokenSets = posts.map((p) => ({
    id: p.external_id,
    tokens: new Set(normalizeTitleTokens(p.title)),
  }));

  const target = tokenSets.find((t) => t.id === externalId);
  if (!target) return 1;

  for (const [root, subreddits] of clusters) {
    const rootEntry = tokenSets.find((t) => t.id === root);
    if (!rootEntry) continue;
    let shared = 0;
    for (const t of target.tokens) {
      if (rootEntry.tokens.has(t)) shared++;
    }
    if (shared >= 2 || root === externalId) {
      return Math.max(1, subreddits.size);
    }
  }

  return 1;
}

// ---------------------------------------------------------------------------
// Comment keyword extraction
// ---------------------------------------------------------------------------

const KEYWORD_STOPWORDS = new Set([
  ...Array.from(CLUSTER_STOPWORDS),
  'im',
  'dont',
  'cant',
  'wont',
  'ive',
  'its',
  'thats',
  'theyre',
  'youre',
  'isnt',
  'wasnt',
  'didnt',
  'doesnt',
  'arent',
  'werent',
  'havent',
  'hadnt',
  'wouldnt',
  'couldnt',
  'shouldnt',
  'also',
  'still',
  'even',
  'much',
  'very',
  'really',
  'actually',
  'going',
  'think',
  'know',
  'get',
  'got',
  'one',
  'two',
  'use',
  'used',
  'using',
  'say',
  'said',
  'see',
  'look',
  'make',
  'made',
  'take',
  'want',
  'need',
  'come',
  'into',
  'than',
  'then',
  'too',
  'some',
  'all',
  'any',
  'now',
  'back',
  'way',
  'well',
  'good',
  'people',
  'time',
  'year',
  'years',
  'thing',
  'things',
  'someone',
  'something',
  'lot',
  'bit',
]);

/**
 * Extract the top-N most frequent meaningful keywords from a list of comment texts.
 * Applies stopword filtering and minimum token length.
 *
 * @param texts  Array of raw comment strings.
 * @param limit  Maximum number of keywords to return (default 3).
 * @returns      Sorted array of keyword strings, most frequent first.
 */
export function extractCommentKeywords(texts: string[], limit = 3): string[] {
  const freq = new Map<string, number>();

  for (const text of texts) {
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= MIN_TOKEN_LEN && !KEYWORD_STOPWORDS.has(t));

    const seen = new Set<string>();
    for (const token of tokens) {
      if (seen.has(token)) continue;
      seen.add(token);
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}
