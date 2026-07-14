/**
 * Nemo Scoring Engine
 * Version 1.0 | 14 July 2026
 *
 * Implements the four scoring formulas exactly as defined in the
 * Nemo Backend Data Signals & Trend Scoring Review document:
 *   1. Creator Velocity Score (corrected)
 *   2. Spike Score (log-normalized, corrected)
 *   3. Cross-Platform Score (new — was missing from original spec)
 *   4. Freshness Multiplier (new — was missing from original spec)
 *   5. Final Nemo Score composite
 */

import {
  CreatorVelocityInputs,
  SpikeScoreInputs,
  CrossPlatformInputs,
  FreshnessInputs,
  NemoScoreInputs,
  NemoScoreResult,
  Platform,
  TrendStatus,
  PLATFORM_WEIGHTS,
  NEMO_SCORE_WEIGHTS,
  SCORING_TIME_RULES,
} from './types';

// ─── Formula 1: Creator Velocity Score ───────────────────────────────────────

/**
 * Creator Velocity Score — CORRECTED formula
 *
 * Original (buggy): creators_last_24h / creators_last_72h
 *   Issue: Produces 0–1 range, difficult to compare; doesn't weight recency.
 *
 * Corrected formula:
 *   creator_velocity = (creators_last_6h × 4 + creators_last_24h) / (creators_last_72h + 1)
 *
 * The 6h count is multiplied by 4 to normalize to a 24h equivalent.
 * +1 in the denominator prevents division-by-zero on new trends.
 *
 * Normalized to 0–100:
 *   creator_velocity_score = MIN(100, creator_velocity × 100 / historical_max_velocity_for_platform)
 *
 * Store historical_max_velocity per platform in DB — update weekly as a rolling max.
 *
 * @returns number 0–100
 */
export function computeCreatorVelocityScore(inputs: CreatorVelocityInputs): number {
  const { creators_last_6h, creators_last_24h, creators_last_72h, historical_max_velocity_for_platform } = inputs;

  // Corrected raw velocity: 6h count × 4 (normalized to 24h equivalent) + 24h count
  const raw_velocity =
    (creators_last_6h * 4 + creators_last_24h) /
    (creators_last_72h + SCORING_TIME_RULES.CREATOR_VELOCITY_DENOMINATOR_FLOOR);

  // Normalize to 0–100 using historical max per platform
  const max = Math.max(historical_max_velocity_for_platform, 1); // guard against 0
  const score = Math.min(100, (raw_velocity * 100) / max);

  return Math.round(score * 100) / 100; // 2 decimal places
}

// ─── Formula 2: Spike Score ───────────────────────────────────────────────────

/**
 * Spike Score — CORRECTED formula (log-normalized)
 *
 * Original (buggy): (mentions_last_24h - mentions_previous_24h) / mentions_previous_24h
 *   Issue 1: Produces extreme unstable values (e.g. 500,000%) for breakout trends.
 *   Issue 2: Division by zero when previous_24h = 0.
 *
 * Corrected formula:
 *   Step 1 (raw spike):
 *     raw_spike = (mentions_last_24h - mentions_previous_24h) / MAX(mentions_previous_24h, 10)
 *     MAX(prev, 10) floor prevents division-by-zero and reduces noise from very low-baseline topics.
 *
 *   Step 2 (log-normalized score):
 *     spike_score = MIN(100, LOG10(MAX(raw_spike × 100, 1)) × 25)
 *     Log10 compression scale:
 *       10× increase  → ~50
 *       100× increase → ~75
 *       1000× increase → ~100
 *
 * @returns number 0–100
 */
export function computeSpikeScore(inputs: SpikeScoreInputs): number {
  const { mentions_last_24h, mentions_prev_24h } = inputs;

  // Step 1: Raw spike with floor to prevent division-by-zero
  const raw_spike =
    (mentions_last_24h - mentions_prev_24h) /
    Math.max(mentions_prev_24h, SCORING_TIME_RULES.SPIKE_FLOOR);

  // Step 2: Log-normalized score
  const score = Math.min(100, Math.log10(Math.max(raw_spike * 100, 1)) * 25);

  return Math.round(Math.max(0, score) * 100) / 100;
}

// ─── Formula 3: Cross-Platform Score ─────────────────────────────────────────

/**
 * Cross-Platform Score — NEW (was missing from original spec)
 *
 * Formula:
 *   cross_platform_score = (platforms_present / total_platforms_monitored) × 100 × platform_weight_sum
 *
 * Platform weights (sum to 1.0):
 *   TikTok = 0.22, Instagram = 0.20, YouTube = 0.20, Google Trends = 0.18,
 *   Twitter/X = 0.12, Reddit = 0.05, LinkedIn = 0.03
 *
 * Example: Trend on TikTok + Instagram + YouTube
 *   → cross_platform_score = (0.22 + 0.20 + 0.20) / 1.0 × 100 = 62
 *
 * @returns number 0–100
 */
export function computeCrossPlatformScore(inputs: CrossPlatformInputs): number {
  const { platforms_present } = inputs;

  if (!platforms_present || platforms_present.length === 0) return 0;

  // Sum weights of all present platforms
  const weight_sum = platforms_present.reduce((sum, platform) => {
    return sum + (PLATFORM_WEIGHTS[platform] ?? 0);
  }, 0);

  // Score = weight_sum × 100 (since weights already sum to 1.0 across all platforms)
  const score = Math.min(100, weight_sum * 100);

  return Math.round(score * 100) / 100;
}

// ─── Formula 4: Freshness Multiplier ─────────────────────────────────────────

/**
 * Freshness Multiplier — NEW (was missing from original spec)
 *
 * Formula:
 *   trend_age_hours = (now - first_detected_timestamp) / 3600
 *   freshness_multiplier = MAX(0.1, 1 - (trend_age_hours / 72))
 *
 * Decay scale:
 *   Just detected = 1.0 multiplier
 *   24h old       = 0.67 multiplier
 *   48h old       = 0.33 multiplier
 *   72h old       = 0.1 multiplier (minimum, not discarded)
 *   >168h (7 days) = 0 (completely discarded — is_expired = true)
 *
 * @returns { multiplier: number (0.1–1.0), trend_age_hours: number, is_expired: boolean }
 */
export function computeFreshnessMultiplier(inputs: FreshnessInputs): {
  multiplier: number;
  trend_age_hours: number;
  is_expired: boolean;
} {
  const now_ms = inputs.now ? new Date(inputs.now).getTime() : Date.now();
  const first_detected_ms = new Date(inputs.first_detected_at).getTime();

  const trend_age_hours = (now_ms - first_detected_ms) / 3600000;

  // Hard expiry at 7 days (168 hours)
  const is_expired = trend_age_hours > SCORING_TIME_RULES.EXPIRY_HOURS;

  if (is_expired) {
    return { multiplier: 0, trend_age_hours, is_expired: true };
  }

  // Freshness multiplier decays linearly from 1.0 to 0.1 over 72 hours
  const multiplier = Math.max(
    SCORING_TIME_RULES.FRESHNESS_MIN,
    1 - trend_age_hours / SCORING_TIME_RULES.FRESHNESS_DECAY_HOURS
  );

  return {
    multiplier: Math.round(multiplier * 1000) / 1000,
    trend_age_hours: Math.round(trend_age_hours * 100) / 100,
    is_expired: false,
  };
}

/**
 * Freshness Score (0–100) — derived from freshness multiplier for use as sub-score input.
 * freshness_score = freshness_multiplier × 100
 *
 * @returns number 0–100
 */
export function computeFreshnessScore(inputs: FreshnessInputs): number {
  const { multiplier } = computeFreshnessMultiplier(inputs);
  return Math.round(multiplier * 100 * 100) / 100;
}

// ─── Final Nemo Score Formula ─────────────────────────────────────────────────

/**
 * Final Nemo Score — Composite Formula
 *
 * nemo_score = (
 *   creator_velocity_score × 0.25 +
 *   spike_score            × 0.30 +
 *   cross_platform_score   × 0.25 +
 *   freshness_score        × 0.20
 * ) × freshness_multiplier
 *
 * The freshness_multiplier is applied as a FINAL multiplier — not just a sub-score input —
 * ensuring even high-spike, high-velocity trends are naturally penalized if 60+ hours old.
 *
 * Sub-score weights:
 *   Creator Velocity Score: 25%
 *   Spike Score:            30%
 *   Cross-Platform Score:   25%
 *   Freshness Score:        20%
 *
 * @returns number 0–100
 */
export function computeNemoScore(inputs: NemoScoreInputs): number {
  const {
    creator_velocity_score,
    spike_score,
    cross_platform_score,
    freshness_score,
    freshness_multiplier,
  } = inputs;

  const weighted_sum =
    creator_velocity_score * NEMO_SCORE_WEIGHTS.creator_velocity +
    spike_score            * NEMO_SCORE_WEIGHTS.spike_score +
    cross_platform_score   * NEMO_SCORE_WEIGHTS.cross_platform +
    freshness_score        * NEMO_SCORE_WEIGHTS.freshness;

  // Apply freshness multiplier as final multiplier
  const nemo_score = Math.min(100, Math.max(0, weighted_sum * freshness_multiplier));

  return Math.round(nemo_score * 100) / 100;
}

// ─── Full Nemo Score Pipeline ─────────────────────────────────────────────────

/**
 * Full scoring pipeline — computes all sub-scores and final Nemo Score from raw inputs.
 *
 * Usage:
 *   const result = computeFullNemoScore({
 *     creatorVelocityInputs: { ... },
 *     spikeInputs: { ... },
 *     crossPlatformInputs: { ... },
 *     freshnessInputs: { ... },
 *   });
 */
export function computeFullNemoScore(params: {
  creatorVelocityInputs: CreatorVelocityInputs;
  spikeInputs: SpikeScoreInputs;
  crossPlatformInputs: CrossPlatformInputs;
  freshnessInputs: FreshnessInputs;
}): NemoScoreResult {
  const creator_velocity_score = computeCreatorVelocityScore(params.creatorVelocityInputs);
  const spike_score = computeSpikeScore(params.spikeInputs);
  const cross_platform_score = computeCrossPlatformScore(params.crossPlatformInputs);
  const { multiplier: freshness_multiplier, trend_age_hours, is_expired } = computeFreshnessMultiplier(params.freshnessInputs);
  const freshness_score = Math.round(freshness_multiplier * 100 * 100) / 100;

  // Expired trends get nemo_score = 0
  if (is_expired) {
    return {
      nemo_score: 0,
      creator_velocity_score,
      spike_score,
      cross_platform_score,
      freshness_score: 0,
      freshness_multiplier: 0,
      is_expired: true,
      trend_age_hours,
    };
  }

  const nemo_score = computeNemoScore({
    creator_velocity_score,
    spike_score,
    cross_platform_score,
    freshness_score,
    freshness_multiplier,
  });

  return {
    nemo_score,
    creator_velocity_score,
    spike_score,
    cross_platform_score,
    freshness_score,
    freshness_multiplier,
    is_expired: false,
    trend_age_hours,
  };
}

// ─── Status Classification ────────────────────────────────────────────────────

/**
 * Classify trend status based on Nemo Score and trend direction.
 *
 * Thresholds (aligned with original spec):
 *   EXPIRED:   is_expired = true
 *   PEAKING:   nemo_score >= 80
 *   RISING:    nemo_score >= 50
 *   DECLINING: nemo_score >= 20
 *   PREDICTED: nemo_score < 20 (early signal, not yet confirmed)
 */
export function classifyTrendStatus(
  nemo_score: number,
  is_expired: boolean,
  freshness_multiplier: number
): TrendStatus {
  if (is_expired) return 'EXPIRED';
  if (nemo_score >= 80) return 'PEAKING';
  if (nemo_score >= 50) return 'RISING';
  if (nemo_score >= 20) return 'DECLINING';
  return 'PREDICTED';
}

// ─── Platform-Specific Signal Helpers ────────────────────────────────────────

/**
 * Reddit normalization helper.
 * Formula: score × (1 + 1/log(subscriber_count))
 * Small community outperformance is a strong signal.
 */
export function normalizeRedditScore(raw_score: number, subscriber_count: number): number {
  if (subscriber_count <= 1) return raw_score;
  const normalized = raw_score * (1 + 1 / Math.log(subscriber_count));
  return Math.round(normalized * 100) / 100;
}

/**
 * TikTok engagement velocity composite.
 * Formula: (Δlikes × 0.3 + Δcomments × 0.4 + Δshares × 0.3) / Δtime
 */
export function computeTikTokEngagementVelocity(params: {
  delta_likes: number;
  delta_comments: number;
  delta_shares: number;
  delta_time_seconds: number;
}): number {
  const { delta_likes, delta_comments, delta_shares, delta_time_seconds } = params;
  if (delta_time_seconds <= 0) return 0;
  const composite = delta_likes * 0.3 + delta_comments * 0.4 + delta_shares * 0.3;
  return Math.round((composite / delta_time_seconds) * 10000) / 10000;
}

/**
 * Twitter/X engagement velocity composite.
 * Formula: reposts × 0.4 + replies × 0.35 + likes × 0.25 / Δtime
 * Reposts carry highest viral weight.
 */
export function computeTwitterEngagementVelocity(params: {
  delta_reposts: number;
  delta_replies: number;
  delta_likes: number;
  delta_time_seconds: number;
}): number {
  const { delta_reposts, delta_replies, delta_likes, delta_time_seconds } = params;
  if (delta_time_seconds <= 0) return 0;
  const composite = delta_reposts * 0.4 + delta_replies * 0.35 + delta_likes * 0.25;
  return Math.round((composite / delta_time_seconds) * 10000) / 10000;
}

/**
 * TikTok creator amplification score.
 * Formula: weighted sum of creator_follower_count × creator_engagement_rate for top 5 creators.
 */
export function computeCreatorAmplificationScore(
  creators: Array<{ follower_count: number; engagement_rate: number }>
): number {
  if (!creators || creators.length === 0) return 0;
  const top5 = creators.slice(0, 5);
  const total = top5.reduce((sum, c) => sum + c.follower_count * c.engagement_rate, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Google Trends breakout multiplier.
 * Apply 2× weight multiplier when breakout_boolean = true (growth >5000%).
 */
export function applyBreakoutMultiplier(score: number, breakout_boolean: boolean): number {
  return breakout_boolean ? Math.min(100, score * 2) : score;
}

/**
 * TikTok audio breakout multiplier.
 * Breakout songs get a 1.5× multiplier in scoring.
 */
export function applyAudioBreakoutMultiplier(score: number, song_audio_breakout: boolean): number {
  return song_audio_breakout ? Math.min(100, score * 1.5) : score;
}

/**
 * YouTube Shorts traffic source multiplier.
 * Shorts feed traffic gets 1.5× multiplier vs search/suggested.
 */
export function applyYouTubeTrafficSourceMultiplier(
  score: number,
  traffic_source: 'shorts_feed' | 'search' | 'suggested' | string
): number {
  return traffic_source === 'shorts_feed' ? Math.min(100, score * 1.5) : score;
}

/**
 * Reddit controversial filter.
 * upvote_ratio < 0.7 = controversial = de-weight (not a scoring input, filter only).
 */
export function isRedditControversial(upvote_ratio: number): boolean {
  return upvote_ratio < 0.7;
}

/**
 * Twitter novelty score.
 * Down-rank topics that appeared in trends in the last 30 days.
 * Returns a 0–100 novelty score: 100 = brand new, lower = recurring topic.
 */
export function computeNoveltyScore(repeated_appearance_count: number): number {
  // Decay: 0 appearances = 100, 10+ appearances = ~0
  const score = Math.max(0, 100 - repeated_appearance_count * 10);
  return Math.round(score);
}

/**
 * LinkedIn share weight multiplier.
 * Shares are weighted 2× vs reactions given their rarity and spread power on LinkedIn.
 */
export function computeLinkedInShareWeight(shares: number, reactions: number): number {
  return shares * 2 + reactions;
}
