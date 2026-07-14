/**
 * Nemo Backend Data Signals & Trend Scoring — Type Definitions
 * Version 1.0 | 14 July 2026
 *
 * Covers all 7 platforms: Instagram, YouTube, Google Trends, Reddit, TikTok, Twitter/X, LinkedIn
 * Tier Legend: CORE | HIGH | MEDIUM | LOW
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Platform =
  | 'instagram' |'youtube' |'google_trends' |'reddit' |'tiktok' |'twitter' |'linkedin';

export type TrendStatus = 'RISING' | 'PEAKING' | 'DECLINING' | 'PREDICTED' | 'EXPIRED';

export type TrendNiche =
  | 'AI' |'fitness' |'finance' |'fashion' |'gaming' |'movies' |'education' |'startups' |'travel' |'food' |'sports' |'marketing' |'productivity' |'business' |'other';

export type HashtagTrendlineShape = 'exponential' | 'linear' | 'plateauing' | 'declining';

export type TrendDirection = 'RISING' | 'PLATEAUING' | 'DECLINING';

export type GoogleTrendsSourceSurface = 'trending_now' | 'explore_rising';

export type RedditSortPosition = 'new' | 'rising' | 'hot' | 'top';

// ─── Platform Signal Interfaces ───────────────────────────────────────────────

/**
 * INSTAGRAM — Data Signals
 * Removed: accounts_reached, active_times (not relevant to trend detection)
 */
export interface InstagramSignals {
  // CORE (must compute)
  reels_play_count_1h: number;           // 22% CORE — first-hour play count velocity trigger
  comment_velocity_5min: number;         // 18% CORE — Δcomments/Δtime over 5-min window
  comment_velocity_15min: number;        // 18% CORE — Δcomments/Δtime over 15-min window

  // HIGH (strong signal)
  shares_dm_sends: number;               // 15% HIGH — DM sends (use Phyllo/Apify for full coverage)
  hashtag_frequency_24h: number;         // 12% HIGH — new posts under hashtag in last 24h (not total)
  audio_reuse_velocity: number;          // 10% HIGH — [NEW] Δaudio_uses/Δtime (Apify/Phyllo required)

  // MEDIUM (supporting)
  saves_count: number;                   // 8% MEDIUM — bookmark count (use for content angle quality, not trend detection)
  likes_velocity: number;                // 6% MEDIUM — Δlikes/Δtime (NOT raw count — raw skews older content)
  follower_growth_delta: number;         // 5% MEDIUM — for creator_amplification_score only

  // Metadata
  trending_audio_id?: string;            // Audio ID if trend is audio-driven
  collected_at: string;                  // ISO timestamp of data collection
}

/**
 * YOUTUBE — Data Signals
 * Removed: shares_count (unreliable signal)
 */
export interface YouTubeSignals {
  // CORE (must compute)
  views_per_hour_1h: number;             // 25% CORE — first 1h views per hour
  views_per_hour_6h: number;             // 25% CORE — first 6h views per hour (both required)
  view_growth_speed_pct: number;         // 20% CORE — percentage increase (not absolute number)
  comment_velocity_15min: number;        // 15% CORE — Δcomments/Δtime over 15-min window
  comment_velocity_60min: number;        // 15% CORE — Δcomments/Δtime over 60-min window

  // HIGH (strong signal)
  search_volume_rising: boolean;         // 12% HIGH — via Google Trends search_type=youtube filter
  shorts_completion_rate_proxy: number;  // 10% HIGH — estimated via high views/low duration ratio (not directly available)
  topic_cluster_score: number;           // 8% HIGH — [NEW] count of videos with similar title keywords + hashtags gaining views in last 24h

  // MEDIUM (supporting)
  likes_per_1000_views: number;          // 5% MEDIUM — ratio instead of raw like count
  traffic_source_weight: number;         // 4% MEDIUM — [NEW] Shorts feed = 1.5× multiplier vs search/suggested

  // Metadata
  video_ids_sample: string[];            // Sample video IDs contributing to this trend
  collected_at: string;
}

/**
 * GOOGLE TRENDS — Data Signals
 */
export interface GoogleTrendsSignals {
  // CORE (must compute)
  breakout_boolean: boolean;             // 30% CORE — growth >5000%; apply 2× weight multiplier when true
  normalized_growth_pct: number;         // 25% CORE — raw percentage from Google (not capped/normalized)
  time_window_4h: number;                // 15% CORE — normalized interest score for 4h window
  time_window_24h: number;               // 15% CORE — normalized interest score for 24h window
  time_window_48h: number;               // 15% CORE — normalized interest score for 48h window
  time_window_7d: number;                // 15% CORE — normalized interest score for 7d window
  active_status: boolean;                // 12% HIGH — Trending Now filter; refresh every 10 minutes

  // HIGH (strong signal)
  geo_spread_score: number;              // 8% HIGH — [NEW] number of states/regions where trend is rising simultaneously

  // MEDIUM (supporting)
  source_surface: GoogleTrendsSourceSurface; // 5% MEDIUM — apply freshness penalty to explore_rising vs trending_now
  category: string;                      // 5% MEDIUM — always store category with each record
  search_type: string;                   // 5% MEDIUM — always store search_type with each record

  // LOW (nice to have)
  query_cluster_id?: string;             // [NEW] groups semantic variants to avoid double-counting

  // Metadata
  geo_regions: string[];                 // Countries/regions where trend is active
  collected_at: string;
}

/**
 * REDDIT — Data Signals
 */
export interface RedditSignals {
  // CORE (must compute)
  score_velocity_5min: number;           // 28% CORE — Δscore/Δtime over 5-min window
  score_velocity_15min: number;          // 28% CORE — Δscore/Δtime over 15-min window
  score_velocity_60min: number;          // 28% CORE — Δscore/Δtime over 60-min window
  comment_velocity: number;              // 22% CORE — Δcomments/Δtime (often stronger than score velocity for early detection)
  cross_subreddit_count: number;         // 15% CORE — threshold: 3+ subreddits = elevated trend signal

  // HIGH (strong signal)
  sort_positions: RedditSortPosition[];  // 12% HIGH — current sort positions as array; 'rising' = earliest signal
  post_age_hours: number;                // 8% HIGH — posts >6h get penalty weight

  // MEDIUM (supporting)
  subreddit_subscriber_count: number;    // 6% MEDIUM — normalization: score × (1 + 1/log(subscriber_count))
  comment_keyword_cluster: string[];     // 5% MEDIUM — [NEW] top 3 keywords by frequency in post comments

  // LOW (nice to have) — used as filters, not scoring inputs
  upvote_ratio: number;                  // 3% LOW — filter only: upvote_ratio < 0.7 = controversial = de-weight
  nsfw_flag: boolean;                    // 1% LOW — hard filter: NSFW=true → exclude entirely

  // Metadata
  subreddit_names: string[];             // Subreddits where this trend appears
  post_ids_sample: string[];
  collected_at: string;
}

/**
 * TIKTOK — Data Signals
 */
export interface TikTokSignals {
  // CORE (must compute)
  hashtag_post_count_velocity_6h: number;   // 22% CORE — Δposts/Δtime under hashtag over 6h
  hashtag_post_count_velocity_24h: number;  // 22% CORE — Δposts/Δtime under hashtag over 24h
  song_audio_breakout_boolean: boolean;     // 20% CORE — breakout songs get 1.5× multiplier
  engagement_velocity: number;             // 18% CORE — composite: (Δlikes×0.3 + Δcomments×0.4 + Δshares×0.3) / Δtime

  // HIGH (strong signal)
  region_spread_score: number;             // 12% HIGH — [NEW] number of distinct regions where hashtag/audio is in top 100
  hashtag_trendline_shape: HashtagTrendlineShape; // 10% HIGH — exponential(high), linear(medium), plateauing(low), declining(penalty)
  creator_amplification_score: number;     // 8% HIGH — [NEW] weighted sum of creator_follower_count × creator_engagement_rate for top 5 creators

  // MEDIUM (supporting)
  cross_entity_spread: number;             // 6% MEDIUM — count of entity types (hashtag/audio/format) carrying same trend
  trend_direction: TrendDirection;         // 4% MEDIUM — compare 3 snapshots at T, T-6h, T-12h

  // LOW (metadata only, not scoring input)
  video_sort_mode?: string;                // store as metadata for reproducibility

  // Metadata
  trending_audio_id?: string;
  hashtag_names: string[];
  collected_at: string;
}

/**
 * TWITTER / X — Data Signals
 */
export interface TwitterSignals {
  // CORE (must compute)
  mention_velocity_5min: number;         // 28% CORE — Δmatching posts over 5-min window (catches flash trends)
  mention_velocity_15min: number;        // 28% CORE — Δmatching posts over 15-min window
  mention_velocity_60min: number;        // 28% CORE — Δmatching posts over 60-min window
  engagement_velocity: number;           // 22% CORE — reposts×0.4 + replies×0.35 + likes×0.25 / Δtime

  // HIGH (strong signal)
  tweet_volume: number | null;           // 15% HIGH — null = not reported (distinct from 0 = zero volume)
  woeid_count: number;                   // 12% HIGH — international spread threshold: 5+ WOEIDs = elevated priority
  novelty_score: number;                 // 10% HIGH — [NEW] down-rank topics from last 30 days; uses repeated_appearance_count
  repeated_appearance_count: number;     // supporting field for novelty_score

  // MEDIUM (supporting)
  query_cluster_id?: string;             // 8% MEDIUM — group semantic variants to avoid double-counting
  trend_created_at: string;              // 3% MEDIUM — freshness decay input: penalize trends older than 6h on X

  // LOW (nice to have)
  flash_trend_flag: boolean;             // 2% LOW — true if appeared in only 1 snapshot (often noise)

  // Metadata
  woeid_list: number[];                  // List of WOEIDs where trend is active
  collected_at: string;
}

/**
 * LINKEDIN — Data Signals
 */
export interface LinkedInSignals {
  // CORE (must compute)
  impression_velocity_1h: number;        // 30% CORE — earliest breakout signal on LinkedIn
  share_repost_velocity: number;         // 25% CORE — shares weighted 2× vs reactions (rarity + spread power)
  comment_velocity: number;              // 18% CORE — comment velocity > reaction velocity as quality signal on LinkedIn

  // HIGH (strong signal)
  professional_diversity_score: number;  // 10% HIGH — [NEW] count of distinct job titles/industries posting on same topic in last 24h

  // MEDIUM (supporting)
  impression_to_view_ratio: number;      // 8% HIGH — proxy for video watch time for third-party content
  reaction_velocity: number;             // 5% MEDIUM — Δreactions/Δtime (not raw count); 'Insightful' reactions signal professional value
  insightful_reaction_count: number;     // supporting field for reaction quality

  // LOW (supplementary only, not scoring inputs)
  creator_amplification_score?: number;  // 3% LOW — use for creator scoring only, not trend scoring
  hashtag_frequency_in_text: number;     // 1% LOW — supplementary topic tagging only; LinkedIn users use hashtags inconsistently

  // Metadata
  topic_keywords: string[];
  collected_at: string;
}

// ─── Scoring Sub-Scores ───────────────────────────────────────────────────────

export interface CreatorVelocityInputs {
  creators_last_6h: number;    // new creators posting about trend in last 6h
  creators_last_24h: number;   // new creators posting in last 24h
  creators_last_72h: number;   // total creators in last 72h (velocity denominator)
  historical_max_velocity_for_platform: number; // rolling max stored per platform, updated weekly
}

export interface SpikeScoreInputs {
  mentions_last_24h: number;   // total mentions/posts in last 24 hours
  mentions_prev_24h: number;   // total mentions/posts in prior 24 hours
}

export interface CrossPlatformInputs {
  platforms_present: Platform[]; // list of platforms where this trend is confirmed
}

export interface FreshnessInputs {
  first_detected_at: string;   // ISO timestamp when Nemo first identified this as a trend
  now?: string;                // ISO timestamp for calculation (defaults to Date.now())
}

export interface NemoScoreInputs {
  creator_velocity_score: number; // 0–100
  spike_score: number;            // 0–100
  cross_platform_score: number;   // 0–100
  freshness_score: number;        // 0–100
  freshness_multiplier: number;   // 0.1–1.0
}

export interface NemoScoreResult {
  nemo_score: number;             // 0–100 final composite score
  creator_velocity_score: number; // 0–100
  spike_score: number;            // 0–100
  cross_platform_score: number;   // 0–100
  freshness_score: number;        // 0–100
  freshness_multiplier: number;   // 0.1–1.0
  is_expired: boolean;            // true if trend_age_hours > 168
  trend_age_hours: number;
}

// ─── Minimum Viable Database Schema ──────────────────────────────────────────

/**
 * TrendRecord — Minimum Viable Database Schema
 * Fields marked required=true are needed for scoring.
 * Store raw_platform_data as JSONB for re-processing if scoring formulas change.
 */
export interface TrendRecord {
  // Required for scoring (*)
  trend_id: string;                      // UUID — unique identifier for each trend record
  topic_text: string;                    // VARCHAR(500) — trend topic / hashtag / query text
  platform: Platform;                    // ENUM — source platform
  niche: TrendNiche;                     // ENUM — content niche category
  first_detected_at: string;             // TIMESTAMP — when Nemo first identified this as a trend
  collected_at: string;                  // TIMESTAMP — when this specific snapshot was collected
  trend_age_hours: number;               // FLOAT — computed: (now - first_detected_at) / 3600
  creator_velocity_score: number;        // FLOAT 0–100 — computed from creator adoption velocity formula
  spike_score: number;                   // FLOAT 0–100 — computed from mention growth formula
  cross_platform_score: number;          // FLOAT 0–100 — computed from platforms_present × weights
  freshness_score: number;               // FLOAT 0–100 — computed from trend_age_hours
  freshness_multiplier: number;          // FLOAT 0.1–1.0 — applied to final score
  nemo_score: number;                    // FLOAT 0–100 — final composite score
  status: TrendStatus;                   // ENUM — RISING / PEAKING / DECLINING / PREDICTED / EXPIRED
  platforms_present: Platform[];         // ARRAY — platforms where this trend is confirmed
  is_expired: boolean;                   // BOOLEAN — true if trend_age_hours > 168 (7 days); hard exclude

  // Optional enrichment fields
  geo_regions?: string[];                // ARRAY — countries/regions where trend is active
  breakout_boolean?: boolean;            // BOOLEAN — Google Trends Breakout flag (>5000% growth)
  mentions_last_24h?: number;            // INTEGER — total mentions/posts in last 24 hours
  mentions_prev_24h?: number;            // INTEGER — total mentions/posts in prior 24 hours (for spike calc)
  creators_last_6h?: number;             // INTEGER — new creators posting in last 6 hours
  creators_last_24h?: number;            // INTEGER — new creators posting in last 24 hours
  creators_last_72h?: number;            // INTEGER — total creators in last 72 hours (velocity denominator)
  engagement_velocity?: number;          // FLOAT — platform-specific composite Δengagement/Δtime
  trending_audio_id?: string;            // VARCHAR — TikTok/Instagram audio ID if audio-driven
  hashtags?: string[];                   // ARRAY — associated hashtags
  related_trend_ids?: string[];          // ARRAY — UUIDs of related trend records
  query_cluster_id?: string;             // UUID — groups semantic variant queries as one trend
  geo_spread_score?: number;             // FLOAT — count of distinct regions where trend is active

  // Raw platform data — stored as JSONB for re-processing if scoring formula changes
  raw_platform_data?: Record<string, unknown>;
}

// ─── Platform Weight Constants ────────────────────────────────────────────────

/**
 * Platform weights for Cross-Platform Score formula.
 * Sum = 1.0
 */
export const PLATFORM_WEIGHTS: Record<Platform, number> = {
  tiktok: 0.22,
  instagram: 0.20,
  youtube: 0.20,
  google_trends: 0.18,
  twitter: 0.12,
  reddit: 0.05,
  linkedin: 0.03,
};

/**
 * Nemo Score sub-score weights.
 * Sum = 1.0
 */
export const NEMO_SCORE_WEIGHTS = {
  creator_velocity: 0.25,
  spike_score: 0.30,
  cross_platform: 0.25,
  freshness: 0.20,
} as const;

/**
 * Time constants for scoring rules.
 */
export const SCORING_TIME_RULES = {
  EXPIRY_HOURS: 168,          // 7 days — trends older than this are excluded (is_expired = true)
  FRESHNESS_DECAY_HOURS: 72,  // Freshness multiplier reaches minimum (0.1) at 72h
  FRESHNESS_MIN: 0.1,         // Minimum freshness multiplier (never 0 until expired)
  SPIKE_FLOOR: 10,            // MAX(prev_mentions, 10) floor to prevent division-by-zero
  CREATOR_VELOCITY_DENOMINATOR_FLOOR: 1, // +1 to prevent division-by-zero on new trends
} as const;
