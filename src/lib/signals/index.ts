/**
 * Nemo Data Signals — Public API
 * Version 1.0 | 14 July 2026
 *
 * Central export for all backend data signal infrastructure.
 * Import from this file for all scoring and signal collection needs.
 */

// Types & Interfaces
export type {
  Platform,
  TrendStatus,
  TrendNiche,
  HashtagTrendlineShape,
  TrendDirection,
  GoogleTrendsSourceSurface,
  RedditSortPosition,
  InstagramSignals,
  YouTubeSignals,
  GoogleTrendsSignals,
  RedditSignals,
  TikTokSignals,
  TwitterSignals,
  LinkedInSignals,
  CreatorVelocityInputs,
  SpikeScoreInputs,
  CrossPlatformInputs,
  FreshnessInputs,
  NemoScoreInputs,
  NemoScoreResult,
  TrendRecord,
} from './types';

export { PLATFORM_WEIGHTS, NEMO_SCORE_WEIGHTS, SCORING_TIME_RULES } from './types';

export {
  DEFAULT_BRIEF_WEIGHTS,
  HARD_REJECT_HOURS,
  SEVEN_DAY_PENALTY_HOURS,
  computeMultiWindowSpike,
  computeCreatorVelocityWindows,
  computeAcceleration,
  computeNoveltyScore as computeBriefNoveltyScore,
  isEvergreenTopic,
  normalizeClusterKey,
  classifyLifecycle,
  applyBriefScore,
  buildWhyTrending,
  clusterTrends,
  pickCanonical,
  deriveVelocitiesFromSnapshots,
} from './briefScoring';
export type {
  BriefWeights,
  LifecycleStatus as BriefLifecycleStatus,
  SnapshotPoint,
} from './briefScoring';

// Scoring Engine — Four Formulas + Final Nemo Score
export {
  computeCreatorVelocityScore,
  computeSpikeScore,
  computeCrossPlatformScore,
  computeFreshnessMultiplier,
  computeFreshnessScore,
  computeNemoScore,
  computeFullNemoScore,
  classifyTrendStatus,
  normalizeRedditScore,
  computeTikTokEngagementVelocity,
  computeTwitterEngagementVelocity,
  computeCreatorAmplificationScore,
  applyBreakoutMultiplier,
  applyAudioBreakoutMultiplier,
  applyYouTubeTrafficSourceMultiplier,
  isRedditControversial,
  computeNoveltyScore,
  computeLinkedInShareWeight,
} from './scoringEngine';

// Platform Signal Collectors
export {
  collectInstagramSignals,
  scoreInstagramSignals,
  collectYouTubeSignals,
  scoreYouTubeSignals,
  collectGoogleTrendsSignals,
  scoreGoogleTrendsSignals,
  collectRedditSignals,
  scoreRedditSignals,
  collectTikTokSignals,
  scoreTikTokSignals,
  collectTwitterSignals,
  scoreTwitterSignals,
  collectLinkedInSignals,
  scoreLinkedInSignals,
  buildTrendRecord,
} from './platformCollectors';

// Database Schema
export {
  NEMO_SCHEMA_SQL,
  SCHEMA_VERSION,
  SCHEMA_DATE,
  SCHEMA_PLATFORM_WEIGHTS,
  SCHEMA_NEMO_SCORE_WEIGHTS,
  NEW_SIGNALS_V1,
  REMOVED_SIGNALS_V1,
} from './schema';
