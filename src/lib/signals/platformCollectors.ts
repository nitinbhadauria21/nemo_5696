/**
 * Nemo Platform Signal Collectors
 * Version 1.0 | 14 July 2026
 *
 * Per-platform signal collection and normalization functions.
 * Each collector validates, normalizes, and prepares signals for scoring.
 *
 * Note: Actual API calls are handled by the data fetching layer.
 * These functions process raw API responses into typed signal objects.
 */

import {
  InstagramSignals,
  YouTubeSignals,
  GoogleTrendsSignals,
  RedditSignals,
  TikTokSignals,
  TwitterSignals,
  LinkedInSignals,
  TrendRecord,
  Platform,
  TrendNiche,
} from './types';

import {
  computeFullNemoScore,
  classifyTrendStatus,
  normalizeRedditScore,
  applyBreakoutMultiplier,
  applyAudioBreakoutMultiplier,
  applyYouTubeTrafficSourceMultiplier,
  isRedditControversial,
  computeNoveltyScore,
} from './scoringEngine';

// ─── Instagram Signal Collector ───────────────────────────────────────────────

/**
 * Validates and normalizes raw Instagram API data into InstagramSignals.
 *
 * Removed signals (not collected):
 *   - accounts_reached: account management metric only
 *   - active_times: belongs in 'best time to post', not trend detection
 *
 * New signals added:
 *   - audio_reuse_velocity: Δaudio_uses/Δtime (requires Apify or Phyllo)
 *
 * Signal notes:
 *   - shares_dm_sends: Instagram only partially exposes via Graph API; use Phyllo/Apify for fuller coverage
 *   - hashtag_frequency_24h: track 'new posts under hashtag in last 24h', NOT total posts
 *   - likes_velocity: use Δlikes/Δtime, NOT raw count (raw skews toward older content)
 *   - follower_growth_delta: for Creator Amplification Score only, not direct trend scoring
 *   - saves_count: useful for content angle quality scoring, not trend detection (weight lower)
 */
export function collectInstagramSignals(raw: Partial<InstagramSignals>): InstagramSignals {
  return {
    reels_play_count_1h: raw.reels_play_count_1h ?? 0,
    comment_velocity_5min: raw.comment_velocity_5min ?? 0,
    comment_velocity_15min: raw.comment_velocity_15min ?? 0,
    shares_dm_sends: raw.shares_dm_sends ?? 0,
    hashtag_frequency_24h: raw.hashtag_frequency_24h ?? 0,
    audio_reuse_velocity: raw.audio_reuse_velocity ?? 0, // [NEW] Apify/Phyllo required
    saves_count: raw.saves_count ?? 0,
    likes_velocity: raw.likes_velocity ?? 0,
    follower_growth_delta: raw.follower_growth_delta ?? 0,
    trending_audio_id: raw.trending_audio_id,
    collected_at: raw.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Compute a platform-level signal score for Instagram (0–100).
 * Weights per document: Play Count 22%, Comment Velocity 18%, Shares 15%,
 * Hashtag Frequency 12%, Audio Reuse Velocity 10%, Saves 8%, Likes Velocity 6%,
 * Follower Growth Delta 5%.
 */
export function scoreInstagramSignals(
  signals: InstagramSignals,
  maxValues: {
    max_reels_play_count_1h: number;
    max_comment_velocity: number;
    max_shares: number;
    max_hashtag_frequency: number;
    max_audio_reuse_velocity: number;
    max_saves: number;
    max_likes_velocity: number;
    max_follower_growth: number;
  }
): number {
  const normalize = (val: number, max: number) => (max > 0 ? Math.min(1, val / max) : 0);

  const score =
    normalize(signals.reels_play_count_1h, maxValues.max_reels_play_count_1h) * 22 +
    normalize(
      Math.max(signals.comment_velocity_5min, signals.comment_velocity_15min),
      maxValues.max_comment_velocity
    ) *
      18 +
    normalize(signals.shares_dm_sends, maxValues.max_shares) * 15 +
    normalize(signals.hashtag_frequency_24h, maxValues.max_hashtag_frequency) * 12 +
    normalize(signals.audio_reuse_velocity, maxValues.max_audio_reuse_velocity) * 10 + // [NEW]
    normalize(signals.saves_count, maxValues.max_saves) * 8 +
    normalize(signals.likes_velocity, maxValues.max_likes_velocity) * 6 +
    normalize(signals.follower_growth_delta, maxValues.max_follower_growth) * 5;

  return Math.round(Math.min(100, score) * 100) / 100;
}

// ─── YouTube Signal Collector ─────────────────────────────────────────────────

/**
 * Validates and normalizes raw YouTube API data into YouTubeSignals.
 *
 * Removed signals (not collected):
 *   - shares_count: unreliable signal; invest in comment velocity instead
 *
 * New signals added:
 *   - topic_cluster_score: count of videos with similar title keywords + hashtags gaining views in last 24h
 *   - traffic_source_weight: Shorts feed traffic gets 1.5× multiplier vs search/suggested
 *
 * Signal notes:
 *   - view_growth_speed_pct: compute as percentage increase, NOT absolute number
 *   - shorts_completion_rate_proxy: not directly available via YouTube Data API;
 *     estimate via high views/low duration ratio as proxy
 *   - likes_per_1000_views: use ratio instead of raw like count
 */
export function collectYouTubeSignals(raw: Partial<YouTubeSignals>): YouTubeSignals {
  return {
    views_per_hour_1h: raw.views_per_hour_1h ?? 0,
    views_per_hour_6h: raw.views_per_hour_6h ?? 0,
    view_growth_speed_pct: raw.view_growth_speed_pct ?? 0,
    comment_velocity_15min: raw.comment_velocity_15min ?? 0,
    comment_velocity_60min: raw.comment_velocity_60min ?? 0,
    search_volume_rising: raw.search_volume_rising ?? false,
    shorts_completion_rate_proxy: raw.shorts_completion_rate_proxy ?? 0,
    topic_cluster_score: raw.topic_cluster_score ?? 0, // [NEW]
    likes_per_1000_views: raw.likes_per_1000_views ?? 0,
    traffic_source_weight: raw.traffic_source_weight ?? 1.0, // [NEW] default = no multiplier
    video_ids_sample: raw.video_ids_sample ?? [],
    collected_at: raw.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Compute a platform-level signal score for YouTube (0–100).
 * Weights per document: Views/Hour 25%, View Growth Speed 20%, Comment Velocity 15%,
 * Search Volume 12%, Shorts Completion Rate 10%, Topic Cluster Score 8%,
 * Likes/1000 Views 5%, Traffic Source Weight 4%.
 */
export function scoreYouTubeSignals(
  signals: YouTubeSignals,
  maxValues: {
    max_views_per_hour: number;
    max_view_growth_pct: number;
    max_comment_velocity: number;
    max_topic_cluster_score: number;
    max_likes_per_1000: number;
  }
): number {
  const normalize = (val: number, max: number) => (max > 0 ? Math.min(1, val / max) : 0);

  const base_score =
    normalize(
      Math.max(signals.views_per_hour_1h, signals.views_per_hour_6h),
      maxValues.max_views_per_hour
    ) *
      25 +
    normalize(signals.view_growth_speed_pct, maxValues.max_view_growth_pct) * 20 +
    normalize(
      Math.max(signals.comment_velocity_15min, signals.comment_velocity_60min),
      maxValues.max_comment_velocity
    ) *
      15 +
    (signals.search_volume_rising ? 12 : 0) +
    normalize(signals.shorts_completion_rate_proxy, 1) * 10 +
    normalize(signals.topic_cluster_score, maxValues.max_topic_cluster_score) * 8 + // [NEW]
    normalize(signals.likes_per_1000_views, maxValues.max_likes_per_1000) * 5;

  // Apply traffic source weight multiplier [NEW]
  const final_score = applyYouTubeTrafficSourceMultiplier(
    base_score,
    signals.traffic_source_weight >= 1.5 ? 'shorts_feed' : 'other'
  );

  return Math.round(Math.min(100, final_score) * 100) / 100;
}

// ─── Google Trends Signal Collector ──────────────────────────────────────────

/**
 * Validates and normalizes raw Google Trends API data into GoogleTrendsSignals.
 *
 * New signals added:
 *   - geo_spread_score: number of states/regions where trend is rising simultaneously
 *   - query_cluster_id: groups semantic variants to avoid double-counting the same trend
 *
 * Signal notes:
 *   - breakout_boolean: store as boolean; apply 2× weight multiplier when true
 *   - normalized_growth_pct: store raw percentage from Google, NOT capped/normalized
 *   - time_window_*: run all 4 time windows per query and store separately with timestamp
 *   - active_status: prioritize active=true signals; refresh every 10 minutes
 *   - source_surface: apply freshness penalty to explore_rising vs trending_now
 */
export function collectGoogleTrendsSignals(raw: Partial<GoogleTrendsSignals>): GoogleTrendsSignals {
  return {
    breakout_boolean: raw.breakout_boolean ?? false,
    normalized_growth_pct: raw.normalized_growth_pct ?? 0,
    time_window_4h: raw.time_window_4h ?? 0,
    time_window_24h: raw.time_window_24h ?? 0,
    time_window_48h: raw.time_window_48h ?? 0,
    time_window_7d: raw.time_window_7d ?? 0,
    active_status: raw.active_status ?? false,
    geo_spread_score: raw.geo_spread_score ?? 0, // [NEW]
    source_surface: raw.source_surface ?? 'explore_rising',
    category: raw.category ?? '',
    search_type: raw.search_type ?? 'web',
    query_cluster_id: raw.query_cluster_id, // [NEW]
    geo_regions: raw.geo_regions ?? [],
    collected_at: raw.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Compute a platform-level signal score for Google Trends (0–100).
 * Weights per document: Breakout Flag 30%, Normalized Growth 25%, Time Window 15%,
 * Active Status 12%, Geo Spread Score 8%, Source Surface 5%, Category/Search Type 5%.
 */
export function scoreGoogleTrendsSignals(
  signals: GoogleTrendsSignals,
  maxValues: {
    max_normalized_growth_pct: number;
    max_geo_spread_score: number;
  }
): number {
  const normalize = (val: number, max: number) => (max > 0 ? Math.min(1, val / max) : 0);

  // Best time window score (use highest of all 4 windows)
  const best_time_window = Math.max(
    signals.time_window_4h,
    signals.time_window_24h,
    signals.time_window_48h,
    signals.time_window_7d
  );

  // Source surface freshness penalty: explore_rising gets 0.8× vs trending_now
  const source_multiplier = signals.source_surface === 'trending_now' ? 1.0 : 0.8;

  let score =
    (signals.breakout_boolean ? 30 : 0) +
    normalize(signals.normalized_growth_pct, maxValues.max_normalized_growth_pct) * 25 +
    normalize(best_time_window, 100) * 15 +
    (signals.active_status ? 12 : 0) +
    normalize(signals.geo_spread_score, maxValues.max_geo_spread_score) * 8 + // [NEW]
    5 * source_multiplier; // source surface

  // Apply breakout 2× multiplier
  score = applyBreakoutMultiplier(score, signals.breakout_boolean);

  return Math.round(Math.min(100, score) * 100) / 100;
}

// ─── Reddit Signal Collector ──────────────────────────────────────────────────

/**
 * Validates and normalizes raw Reddit API data into RedditSignals.
 *
 * New signals added:
 *   - comment_keyword_cluster: top 3 keywords by frequency in post comments
 *
 * Signal notes:
 *   - score_velocity_*: all three time windows required; store as snapshot deltas
 *   - comment_velocity: often stronger than score velocity for early detection
 *   - cross_subreddit_count: threshold 3+ subreddits = elevated trend signal
 *   - sort_positions: store as array; 'rising' position is earliest possible signal
 *   - post_age_hours: posts >6h get penalty weight
 *   - subreddit_subscriber_count: normalize using formula score × (1 + 1/log(subscriber_count))
 *   - upvote_ratio: filter only (< 0.7 = controversial = de-weight); NOT a scoring input
 *   - nsfw_flag: hard filter; NSFW=true → exclude from all trend feeds entirely
 */
export function collectRedditSignals(raw: Partial<RedditSignals>): RedditSignals {
  return {
    score_velocity_5min: raw.score_velocity_5min ?? 0,
    score_velocity_15min: raw.score_velocity_15min ?? 0,
    score_velocity_60min: raw.score_velocity_60min ?? 0,
    comment_velocity: raw.comment_velocity ?? 0,
    cross_subreddit_count: raw.cross_subreddit_count ?? 0,
    sort_positions: raw.sort_positions ?? [],
    post_age_hours: raw.post_age_hours ?? 0,
    subreddit_subscriber_count: raw.subreddit_subscriber_count ?? 1,
    comment_keyword_cluster: raw.comment_keyword_cluster ?? [], // [NEW] top 3 keywords
    upvote_ratio: raw.upvote_ratio ?? 1.0,
    nsfw_flag: raw.nsfw_flag ?? false,
    subreddit_names: raw.subreddit_names ?? [],
    post_ids_sample: raw.post_ids_sample ?? [],
    collected_at: raw.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Compute a platform-level signal score for Reddit (0–100).
 * Weights per document: Score Velocity 28%, Comment Velocity 22%, Cross-Subreddit 15%,
 * Sort Position 12%, Post Age 8%, Subreddit Size 6%, Comment Keyword Cluster 5%.
 *
 * Filters applied before scoring:
 *   - nsfw_flag = true → return 0 (hard exclude)
 *   - upvote_ratio < 0.7 → de-weight by 0.5×
 */
export function scoreRedditSignals(
  signals: RedditSignals,
  maxValues: {
    max_score_velocity: number;
    max_comment_velocity: number;
  }
): number {
  // Hard filter: NSFW content excluded entirely
  if (signals.nsfw_flag) return 0;

  const normalize = (val: number, max: number) => (max > 0 ? Math.min(1, val / max) : 0);

  // Best score velocity across all 3 time windows
  const best_score_velocity = Math.max(
    signals.score_velocity_5min,
    signals.score_velocity_15min,
    signals.score_velocity_60min
  );

  // Normalize score velocity using subscriber count
  const normalized_velocity = normalizeRedditScore(
    best_score_velocity,
    signals.subreddit_subscriber_count
  );

  // Sort position bonus: 'rising' = 12 points (earliest signal), 'hot' = 8, 'top' = 4
  const sort_bonus = signals.sort_positions.includes('rising')
    ? 12
    : signals.sort_positions.includes('hot')
      ? 8
      : signals.sort_positions.includes('top')
        ? 4
        : 0;

  // Post age penalty: posts >6h get reduced weight
  const age_factor = signals.post_age_hours > 6 ? 0.5 : 1.0;

  // Cross-subreddit bonus: 3+ subreddits = elevated signal
  const cross_sub_score =
    signals.cross_subreddit_count >= 3 ? 15 : (signals.cross_subreddit_count / 3) * 15;

  // Comment keyword cluster bonus [NEW]
  const keyword_bonus = signals.comment_keyword_cluster.length > 0 ? 5 : 0;

  let score =
    normalize(normalized_velocity, maxValues.max_score_velocity) * 28 * age_factor +
    normalize(signals.comment_velocity, maxValues.max_comment_velocity) * 22 +
    cross_sub_score +
    sort_bonus +
    keyword_bonus;

  // Controversial filter: de-weight by 0.5×
  if (isRedditControversial(signals.upvote_ratio)) {
    score *= 0.5;
  }

  return Math.round(Math.min(100, score) * 100) / 100;
}

// ─── TikTok Signal Collector ──────────────────────────────────────────────────

/**
 * Validates and normalizes raw TikTok API data into TikTokSignals.
 *
 * New signals added:
 *   - region_spread_score: number of distinct regions where hashtag/audio is in top 100
 *   - creator_amplification_score: weighted sum of creator_follower_count × creator_engagement_rate for top 5 creators
 *
 * Signal notes:
 *   - hashtag_post_count_velocity: track as 6h and 24h deltas; 'New to Top 100' hashtags get highest priority
 *   - song_audio_breakout_boolean: breakout songs get 1.5× multiplier; store separately from Popular
 *   - engagement_velocity: composite = (Δlikes×0.3 + Δcomments×0.4 + Δshares×0.3) / Δtime
 *   - hashtag_trendline_shape: exponential(high weight), linear(medium), plateauing(low), declining(penalty)
 *   - trend_direction: compare 3 snapshots at T, T-6h, T-12h
 *   - video_sort_mode: store as metadata only, NOT a scoring input
 */
export function collectTikTokSignals(raw: Partial<TikTokSignals>): TikTokSignals {
  return {
    hashtag_post_count_velocity_6h: raw.hashtag_post_count_velocity_6h ?? 0,
    hashtag_post_count_velocity_24h: raw.hashtag_post_count_velocity_24h ?? 0,
    song_audio_breakout_boolean: raw.song_audio_breakout_boolean ?? false,
    engagement_velocity: raw.engagement_velocity ?? 0,
    region_spread_score: raw.region_spread_score ?? 0, // [NEW]
    hashtag_trendline_shape: raw.hashtag_trendline_shape ?? 'linear',
    creator_amplification_score: raw.creator_amplification_score ?? 0, // [NEW]
    cross_entity_spread: raw.cross_entity_spread ?? 0,
    trend_direction: raw.trend_direction ?? 'RISING',
    video_sort_mode: raw.video_sort_mode, // metadata only
    trending_audio_id: raw.trending_audio_id,
    hashtag_names: raw.hashtag_names ?? [],
    collected_at: raw.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Compute a platform-level signal score for TikTok (0–100).
 * Weights per document: Hashtag Post Count Velocity 22%, Song/Audio Breakout 20%,
 * Engagement Velocity 18%, Regional Popularity 12%, Hashtag Trendline 10%,
 * Creator Amplification 8%, Cross-Entity Spread 6%, Trend Persistence 4%.
 */
export function scoreTikTokSignals(
  signals: TikTokSignals,
  maxValues: {
    max_hashtag_velocity: number;
    max_engagement_velocity: number;
    max_region_spread_score: number;
    max_creator_amplification_score: number;
  }
): number {
  const normalize = (val: number, max: number) => (max > 0 ? Math.min(1, val / max) : 0);

  // Hashtag trendline shape weight
  const trendline_weight =
    {
      exponential: 1.0,
      linear: 0.6,
      plateauing: 0.3,
      declining: -0.2,
    }[signals.hashtag_trendline_shape] ?? 0.6;

  // Trend direction weight
  const direction_weight =
    {
      RISING: 1.0,
      PLATEAUING: 0.5,
      DECLINING: 0.2,
    }[signals.trend_direction] ?? 1.0;

  const best_hashtag_velocity = Math.max(
    signals.hashtag_post_count_velocity_6h,
    signals.hashtag_post_count_velocity_24h
  );

  let score =
    normalize(best_hashtag_velocity, maxValues.max_hashtag_velocity) * 22 +
    (signals.song_audio_breakout_boolean ? 20 : 0) +
    normalize(signals.engagement_velocity, maxValues.max_engagement_velocity) * 18 +
    normalize(signals.region_spread_score, maxValues.max_region_spread_score) * 12 + // [NEW]
    normalize(best_hashtag_velocity, maxValues.max_hashtag_velocity) * 10 * trendline_weight +
    normalize(signals.creator_amplification_score, maxValues.max_creator_amplification_score) * 8 + // [NEW]
    Math.min(6, signals.cross_entity_spread * 2) +
    4 * direction_weight;

  // Apply audio breakout 1.5× multiplier
  score = applyAudioBreakoutMultiplier(score, signals.song_audio_breakout_boolean);

  return Math.round(Math.min(100, score) * 100) / 100;
}

// ─── Twitter/X Signal Collector ───────────────────────────────────────────────

/**
 * Validates and normalizes raw Twitter/X API data into TwitterSignals.
 *
 * New signals added:
 *   - novelty_score: down-rank topics that appeared in trends in the last 30 days
 *   - repeated_appearance_count: supporting field for novelty_score
 *
 * Signal notes:
 *   - mention_velocity: compute over all 3 time windows; 5-min window catches flash trends
 *   - engagement_velocity: reposts×0.4 + replies×0.35 + likes×0.25 (reposts = highest viral weight)
 *   - tweet_volume: mark records where volume is null vs 0 (null = not reported, 0 = zero volume)
 *   - woeid_count: international spread threshold: 5+ WOEIDs = elevated priority
 *   - trend_created_at: freshness decay input; penalize trends older than 6h on X
 *   - flash_trend_flag: true if appeared in only 1 snapshot (often noise); filter or de-weight
 */
export function collectTwitterSignals(raw: Partial<TwitterSignals>): TwitterSignals {
  return {
    mention_velocity_5min: raw.mention_velocity_5min ?? 0,
    mention_velocity_15min: raw.mention_velocity_15min ?? 0,
    mention_velocity_60min: raw.mention_velocity_60min ?? 0,
    engagement_velocity: raw.engagement_velocity ?? 0,
    tweet_volume: raw.tweet_volume !== undefined ? raw.tweet_volume : null, // preserve null vs 0
    woeid_count: raw.woeid_count ?? 0,
    novelty_score: raw.novelty_score ?? computeNoveltyScore(raw.repeated_appearance_count ?? 0), // [NEW]
    repeated_appearance_count: raw.repeated_appearance_count ?? 0, // [NEW]
    query_cluster_id: raw.query_cluster_id,
    trend_created_at: raw.trend_created_at ?? new Date().toISOString(),
    flash_trend_flag: raw.flash_trend_flag ?? false,
    woeid_list: raw.woeid_list ?? [],
    collected_at: raw.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Compute a platform-level signal score for Twitter/X (0–100).
 * Weights per document: Mention Velocity 28%, Engagement Velocity 22%, Tweet Volume 15%,
 * Geo Spread Score 12%, Novelty Score 10%, Cluster Score 8%, Trend Creation Time 3%,
 * Persistence Score 2%.
 */
export function scoreTwitterSignals(
  signals: TwitterSignals,
  maxValues: {
    max_mention_velocity: number;
    max_engagement_velocity: number;
    max_tweet_volume: number;
  }
): number {
  const normalize = (val: number, max: number) => (max > 0 ? Math.min(1, val / max) : 0);

  // Best mention velocity across all 3 time windows
  const best_mention_velocity = Math.max(
    signals.mention_velocity_5min,
    signals.mention_velocity_15min,
    signals.mention_velocity_60min
  );

  // WOEID spread: 5+ WOEIDs = elevated priority (full 12 points)
  const geo_score = signals.woeid_count >= 5 ? 12 : (signals.woeid_count / 5) * 12;

  // Freshness penalty for X: penalize trends older than 6h
  const trend_age_hours = (Date.now() - new Date(signals.trend_created_at).getTime()) / 3600000;
  const freshness_factor = trend_age_hours > 6 ? 0.5 : 1.0;

  // Flash trend de-weight
  const persistence_factor = signals.flash_trend_flag ? 0.5 : 1.0;

  const score =
    normalize(best_mention_velocity, maxValues.max_mention_velocity) * 28 * freshness_factor +
    normalize(signals.engagement_velocity, maxValues.max_engagement_velocity) * 22 +
    normalize(signals.tweet_volume ?? 0, maxValues.max_tweet_volume) * 15 +
    geo_score +
    normalize(signals.novelty_score, 100) * 10 + // [NEW]
    3 * freshness_factor +
    2 * persistence_factor;

  return Math.round(Math.min(100, score) * 100) / 100;
}

// ─── LinkedIn Signal Collector ────────────────────────────────────────────────

/**
 * Validates and normalizes raw LinkedIn API data into LinkedInSignals.
 *
 * New signals added:
 *   - professional_diversity_score: count of distinct job titles/industries posting on same topic in last 24h
 *
 * Removed/de-prioritized signals:
 *   - hashtag_frequency_in_text: supplementary topic tagging only; LinkedIn users use hashtags inconsistently
 *   - profile_views/follower_delta: moved to creator_amplification_score only
 *
 * Signal notes:
 *   - impression_velocity_1h: earliest breakout signal available on LinkedIn
 *   - share_repost_velocity: weight shares 2× vs reactions (rarity + spread power)
 *   - comment_velocity: comment velocity > reaction velocity as quality signal on LinkedIn
 *   - impression_to_view_ratio: proxy for video watch time for third-party content
 *   - reaction_velocity: use Δreactions/Δtime not raw count; 'Insightful' reactions signal professional value
 */
export function collectLinkedInSignals(raw: Partial<LinkedInSignals>): LinkedInSignals {
  return {
    impression_velocity_1h: raw.impression_velocity_1h ?? 0,
    share_repost_velocity: raw.share_repost_velocity ?? 0,
    comment_velocity: raw.comment_velocity ?? 0,
    professional_diversity_score: raw.professional_diversity_score ?? 0, // [NEW]
    impression_to_view_ratio: raw.impression_to_view_ratio ?? 0,
    reaction_velocity: raw.reaction_velocity ?? 0,
    insightful_reaction_count: raw.insightful_reaction_count ?? 0,
    creator_amplification_score: raw.creator_amplification_score,
    hashtag_frequency_in_text: raw.hashtag_frequency_in_text ?? 0, // supplementary only
    topic_keywords: raw.topic_keywords ?? [],
    collected_at: raw.collected_at ?? new Date().toISOString(),
  };
}

/**
 * Compute a platform-level signal score for LinkedIn (0–100).
 * Weights per document: Impression Velocity 30%, Share/Repost Velocity 25%,
 * Comment Velocity 18%, Topic Spread (Professional Diversity) 10%,
 * Video Watch Time/Unique Viewers 8%, Reaction Count 5%.
 *
 * Note: Shares are weighted 2× vs reactions given their rarity and spread power on LinkedIn.
 */
export function scoreLinkedInSignals(
  signals: LinkedInSignals,
  maxValues: {
    max_impression_velocity: number;
    max_share_velocity: number;
    max_comment_velocity: number;
    max_professional_diversity_score: number;
    max_reaction_velocity: number;
  }
): number {
  const normalize = (val: number, max: number) => (max > 0 ? Math.min(1, val / max) : 0);

  // Shares weighted 2× vs reactions
  const weighted_share_score = normalize(
    signals.share_repost_velocity * 2,
    maxValues.max_share_velocity * 2
  );

  const score =
    normalize(signals.impression_velocity_1h, maxValues.max_impression_velocity) * 30 +
    weighted_share_score * 25 +
    normalize(signals.comment_velocity, maxValues.max_comment_velocity) * 18 +
    normalize(signals.professional_diversity_score, maxValues.max_professional_diversity_score) *
      10 + // [NEW]
    normalize(signals.impression_to_view_ratio, 1) * 8 +
    normalize(signals.reaction_velocity, maxValues.max_reaction_velocity) * 5;

  return Math.round(Math.min(100, score) * 100) / 100;
}

// ─── Unified Trend Record Builder ─────────────────────────────────────────────

/**
 * Build a complete TrendRecord from raw platform signals.
 * This is the main entry point for creating a scored trend record.
 */
export function buildTrendRecord(params: {
  trend_id: string;
  topic_text: string;
  platform: Platform;
  niche: TrendNiche;
  first_detected_at: string;
  platforms_present: Platform[];
  mentions_last_24h: number;
  mentions_prev_24h: number;
  creators_last_6h: number;
  creators_last_24h: number;
  creators_last_72h: number;
  historical_max_velocity_for_platform: number;
  geo_regions?: string[];
  breakout_boolean?: boolean;
  engagement_velocity?: number;
  trending_audio_id?: string;
  hashtags?: string[];
  related_trend_ids?: string[];
  query_cluster_id?: string;
  geo_spread_score?: number;
  raw_platform_data?: Record<string, unknown>;
}): TrendRecord {
  const now = new Date().toISOString();

  const scoreResult = computeFullNemoScore({
    creatorVelocityInputs: {
      creators_last_6h: params.creators_last_6h,
      creators_last_24h: params.creators_last_24h,
      creators_last_72h: params.creators_last_72h,
      historical_max_velocity_for_platform: params.historical_max_velocity_for_platform,
    },
    spikeInputs: {
      mentions_last_24h: params.mentions_last_24h,
      mentions_prev_24h: params.mentions_prev_24h,
    },
    crossPlatformInputs: {
      platforms_present: params.platforms_present,
    },
    freshnessInputs: {
      first_detected_at: params.first_detected_at,
      now,
    },
  });

  const status = classifyTrendStatus(
    scoreResult.nemo_score,
    scoreResult.is_expired,
    scoreResult.freshness_multiplier
  );

  return {
    trend_id: params.trend_id,
    topic_text: params.topic_text,
    platform: params.platform,
    niche: params.niche,
    first_detected_at: params.first_detected_at,
    collected_at: now,
    trend_age_hours: scoreResult.trend_age_hours,
    creator_velocity_score: scoreResult.creator_velocity_score,
    spike_score: scoreResult.spike_score,
    cross_platform_score: scoreResult.cross_platform_score,
    freshness_score: scoreResult.freshness_score,
    freshness_multiplier: scoreResult.freshness_multiplier,
    nemo_score: scoreResult.nemo_score,
    status,
    platforms_present: params.platforms_present,
    is_expired: scoreResult.is_expired,
    geo_regions: params.geo_regions,
    breakout_boolean: params.breakout_boolean,
    mentions_last_24h: params.mentions_last_24h,
    mentions_prev_24h: params.mentions_prev_24h,
    creators_last_6h: params.creators_last_6h,
    creators_last_24h: params.creators_last_24h,
    creators_last_72h: params.creators_last_72h,
    engagement_velocity: params.engagement_velocity,
    trending_audio_id: params.trending_audio_id,
    hashtags: params.hashtags,
    related_trend_ids: params.related_trend_ids,
    query_cluster_id: params.query_cluster_id,
    geo_spread_score: params.geo_spread_score,
    raw_platform_data: params.raw_platform_data,
  };
}
