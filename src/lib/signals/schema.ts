/**
 * Nemo Database Schema — SQL Migration
 * Version 1.0 | 14 July 2026
 *
 * Minimum Viable Database Schema as defined in the
 * Nemo Backend Data Signals & Trend Scoring Review document.
 *
 * Compatible with PostgreSQL / Supabase.
 * Fields marked with * are required for scoring.
 *
 * IMPORTANT: Store raw_platform_data as JSONB to allow re-scoring
 * historical trends if the scoring formula is updated, without re-fetching from APIs.
 */

export const NEMO_SCHEMA_SQL = `
-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE platform_enum AS ENUM (
  'instagram',
  'youtube',
  'google_trends',
  'reddit',
  'tiktok',
  'twitter',
  'linkedin'
);

CREATE TYPE trend_status_enum AS ENUM (
  'RISING',
  'PEAKING',
  'DECLINING',
  'PREDICTED',
  'EXPIRED'
);

CREATE TYPE trend_niche_enum AS ENUM (
  'AI',
  'fitness',
  'finance',
  'fashion',
  'gaming',
  'movies',
  'education',
  'startups',
  'travel',
  'food',
  'sports',
  'marketing',
  'productivity',
  'business',
  'other'
);

CREATE TYPE hashtag_trendline_enum AS ENUM (
  'exponential',
  'linear',
  'plateauing',
  'declining'
);

CREATE TYPE trend_direction_enum AS ENUM (
  'RISING',
  'PLATEAUING',
  'DECLINING'
);

CREATE TYPE google_source_surface_enum AS ENUM (
  'trending_now',
  'explore_rising'
);

-- ─── Core Trend Records Table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trend_records (
  -- Required for scoring (*)
  trend_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_text                VARCHAR(500) NOT NULL,                    -- * trend topic / hashtag / query text
  platform                  platform_enum NOT NULL,                   -- * source platform
  niche                     trend_niche_enum NOT NULL,                -- * content niche category
  first_detected_at         TIMESTAMPTZ NOT NULL,                     -- * when Nemo first identified this as a trend
  collected_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- * when this specific snapshot was collected
  trend_age_hours           FLOAT NOT NULL DEFAULT 0,                 -- * computed: (now - first_detected_at) / 3600
  creator_velocity_score    FLOAT NOT NULL DEFAULT 0 CHECK (creator_velocity_score >= 0 AND creator_velocity_score <= 100),  -- * 0–100
  spike_score               FLOAT NOT NULL DEFAULT 0 CHECK (spike_score >= 0 AND spike_score <= 100),                        -- * 0–100
  cross_platform_score      FLOAT NOT NULL DEFAULT 0 CHECK (cross_platform_score >= 0 AND cross_platform_score <= 100),      -- * 0–100
  freshness_score           FLOAT NOT NULL DEFAULT 0 CHECK (freshness_score >= 0 AND freshness_score <= 100),                -- * 0–100
  freshness_multiplier      FLOAT NOT NULL DEFAULT 1.0 CHECK (freshness_multiplier >= 0 AND freshness_multiplier <= 1.0),    -- * 0.1–1.0
  nemo_score                FLOAT NOT NULL DEFAULT 0 CHECK (nemo_score >= 0 AND nemo_score <= 100),                          -- * 0–100 final composite
  status                    trend_status_enum NOT NULL DEFAULT 'PREDICTED',  -- * RISING / PEAKING / DECLINING / PREDICTED / EXPIRED
  platforms_present         platform_enum[] NOT NULL DEFAULT '{}',   -- * platforms where this trend is confirmed
  is_expired                BOOLEAN NOT NULL DEFAULT FALSE,           -- * true if trend_age_hours > 168 (7 days)

  -- Optional enrichment fields
  geo_regions               TEXT[],                                   -- countries/regions where trend is active
  breakout_boolean          BOOLEAN,                                  -- Google Trends Breakout flag (>5000% growth)
  mentions_last_24h         INTEGER,                                  -- total mentions/posts in last 24 hours
  mentions_prev_24h         INTEGER,                                  -- total mentions/posts in prior 24 hours (for spike calc)
  creators_last_6h          INTEGER,                                  -- new creators posting in last 6 hours
  creators_last_24h         INTEGER,                                  -- new creators posting in last 24 hours
  creators_last_72h         INTEGER,                                  -- total creators in last 72 hours (velocity denominator)
  engagement_velocity       FLOAT,                                    -- platform-specific composite Δengagement/Δtime
  trending_audio_id         VARCHAR(255),                             -- TikTok/Instagram audio ID if audio-driven
  hashtags                  TEXT[],                                   -- associated hashtags
  related_trend_ids         UUID[],                                   -- UUIDs of related trend records
  query_cluster_id          UUID,                                     -- groups semantic variant queries as one trend
  geo_spread_score          FLOAT,                                    -- count of distinct regions where trend is active

  -- Raw platform data — stored as JSONB for re-processing if scoring formula changes
  raw_platform_data         JSONB,

  -- Audit fields
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Instagram Signals Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS instagram_signals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id                    UUID NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CORE signals (22% + 18% + 18% = 58%)
  reels_play_count_1h         BIGINT NOT NULL DEFAULT 0,              -- 22% CORE: first-hour play count velocity trigger
  comment_velocity_5min       FLOAT NOT NULL DEFAULT 0,               -- 18% CORE: Δcomments/Δtime over 5-min window
  comment_velocity_15min      FLOAT NOT NULL DEFAULT 0,               -- 18% CORE: Δcomments/Δtime over 15-min window

  -- HIGH signals (15% + 12% + 10% = 37%)
  shares_dm_sends             BIGINT NOT NULL DEFAULT 0,              -- 15% HIGH: DM sends (Phyllo/Apify for full coverage)
  hashtag_frequency_24h       INTEGER NOT NULL DEFAULT 0,             -- 12% HIGH: new posts under hashtag in last 24h (NOT total)
  audio_reuse_velocity        FLOAT NOT NULL DEFAULT 0,               -- 10% HIGH: [NEW] Δaudio_uses/Δtime (Apify/Phyllo required)

  -- MEDIUM signals (8% + 6% + 5% = 19%)
  saves_count                 BIGINT NOT NULL DEFAULT 0,              -- 8% MEDIUM: bookmark count (content angle quality, not trend detection)
  likes_velocity              FLOAT NOT NULL DEFAULT 0,               -- 6% MEDIUM: Δlikes/Δtime (NOT raw count)
  follower_growth_delta       INTEGER NOT NULL DEFAULT 0,             -- 5% MEDIUM: for creator_amplification_score only

  -- Metadata
  trending_audio_id           VARCHAR(255),                           -- audio ID if trend is audio-driven
  platform_score              FLOAT,                                  -- computed platform-level score 0–100

  -- REMOVED signals (not stored):
  -- accounts_reached: account management metric only; not available for third-party content
  -- active_times: belongs in 'best time to post' feature, not trend detection

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── YouTube Signals Table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS youtube_signals (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id                        UUID NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CORE signals (25% + 20% + 15% = 60%)
  views_per_hour_1h               BIGINT NOT NULL DEFAULT 0,          -- 25% CORE: first 1h views per hour (required)
  views_per_hour_6h               BIGINT NOT NULL DEFAULT 0,          -- 25% CORE: first 6h views per hour (required)
  view_growth_speed_pct           FLOAT NOT NULL DEFAULT 0,           -- 20% CORE: percentage increase (NOT absolute number)
  comment_velocity_15min          FLOAT NOT NULL DEFAULT 0,           -- 15% CORE: Δcomments/Δtime over 15-min window
  comment_velocity_60min          FLOAT NOT NULL DEFAULT 0,           -- 15% CORE: Δcomments/Δtime over 60-min window

  -- HIGH signals (12% + 10% + 8% = 30%)
  search_volume_rising            BOOLEAN NOT NULL DEFAULT FALSE,     -- 12% HIGH: via Google Trends search_type=youtube filter
  shorts_completion_rate_proxy    FLOAT NOT NULL DEFAULT 0,           -- 10% HIGH: estimated via high views/low duration ratio
  topic_cluster_score             INTEGER NOT NULL DEFAULT 0,         -- 8% HIGH: [NEW] count of videos with similar keywords gaining views in last 24h

  -- MEDIUM signals (5% + 4% = 9%)
  likes_per_1000_views            FLOAT NOT NULL DEFAULT 0,           -- 5% MEDIUM: ratio instead of raw like count
  traffic_source_weight           FLOAT NOT NULL DEFAULT 1.0,         -- 4% MEDIUM: [NEW] Shorts feed = 1.5× multiplier vs search/suggested

  -- Metadata
  video_ids_sample                TEXT[],                             -- sample video IDs contributing to this trend
  platform_score                  FLOAT,                              -- computed platform-level score 0–100

  -- REMOVED signals (not stored):
  -- shares_count: unreliable signal; invest in comment velocity instead

  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Google Trends Signals Table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS google_trends_signals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id                    UUID NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CORE signals (30% + 25% + 15% + 12% = 82%)
  breakout_boolean            BOOLEAN NOT NULL DEFAULT FALSE,         -- 30% CORE: growth >5000%; 2× weight multiplier when true
  normalized_growth_pct       FLOAT NOT NULL DEFAULT 0,              -- 25% CORE: raw percentage from Google (NOT capped/normalized)
  time_window_4h              FLOAT NOT NULL DEFAULT 0,              -- 15% CORE: normalized interest score for 4h window
  time_window_24h             FLOAT NOT NULL DEFAULT 0,              -- 15% CORE: normalized interest score for 24h window
  time_window_48h             FLOAT NOT NULL DEFAULT 0,              -- 15% CORE: normalized interest score for 48h window
  time_window_7d              FLOAT NOT NULL DEFAULT 0,              -- 15% CORE: normalized interest score for 7d window
  active_status               BOOLEAN NOT NULL DEFAULT FALSE,        -- 12% HIGH: Trending Now filter; refresh every 10 minutes

  -- HIGH signals (8%)
  geo_spread_score            FLOAT NOT NULL DEFAULT 0,              -- 8% HIGH: [NEW] number of states/regions where trend is rising simultaneously

  -- MEDIUM signals (5% + 5% = 10%)
  source_surface              google_source_surface_enum NOT NULL DEFAULT 'explore_rising',  -- 5% MEDIUM: freshness penalty for explore_rising
  category                    VARCHAR(100),                          -- 5% MEDIUM: always store category with each record
  search_type                 VARCHAR(50) NOT NULL DEFAULT 'web',    -- 5% MEDIUM: always store search_type with each record

  -- LOW signals
  query_cluster_id            UUID,                                  -- [NEW] groups semantic variants to avoid double-counting

  -- Metadata
  geo_regions                 TEXT[],                                -- countries/regions where trend is active
  platform_score              FLOAT,                                 -- computed platform-level score 0–100

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Reddit Signals Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reddit_signals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id                    UUID NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CORE signals (28% + 22% + 15% = 65%)
  score_velocity_5min         FLOAT NOT NULL DEFAULT 0,              -- 28% CORE: Δscore/Δtime over 5-min window
  score_velocity_15min        FLOAT NOT NULL DEFAULT 0,              -- 28% CORE: Δscore/Δtime over 15-min window
  score_velocity_60min        FLOAT NOT NULL DEFAULT 0,              -- 28% CORE: Δscore/Δtime over 60-min window
  comment_velocity            FLOAT NOT NULL DEFAULT 0,              -- 22% CORE: Δcomments/Δtime (often stronger than score velocity)
  cross_subreddit_count       INTEGER NOT NULL DEFAULT 0,            -- 15% CORE: threshold 3+ subreddits = elevated trend signal

  -- HIGH signals (12% + 8% = 20%)
  sort_positions              TEXT[] NOT NULL DEFAULT '{}',          -- 12% HIGH: current sort positions; 'rising' = earliest signal
  post_age_hours              FLOAT NOT NULL DEFAULT 0,              -- 8% HIGH: posts >6h get penalty weight

  -- MEDIUM signals (6% + 5% = 11%)
  subreddit_subscriber_count  BIGINT NOT NULL DEFAULT 1,             -- 6% MEDIUM: normalize: score × (1 + 1/log(subscriber_count))
  comment_keyword_cluster     TEXT[] NOT NULL DEFAULT '{}',          -- 5% MEDIUM: [NEW] top 3 keywords by frequency in post comments

  -- LOW signals (filters only, not scoring inputs)
  upvote_ratio                FLOAT NOT NULL DEFAULT 1.0,            -- 3% LOW: filter only (<0.7 = controversial = de-weight)
  nsfw_flag                   BOOLEAN NOT NULL DEFAULT FALSE,        -- 1% LOW: hard filter; NSFW=true → exclude entirely

  -- Metadata
  subreddit_names             TEXT[],                                -- subreddits where this trend appears
  post_ids_sample             TEXT[],                                -- sample post IDs
  platform_score              FLOAT,                                 -- computed platform-level score 0–100

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TikTok Signals Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tiktok_signals (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id                        UUID NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CORE signals (22% + 20% + 18% = 60%)
  hashtag_post_count_velocity_6h  FLOAT NOT NULL DEFAULT 0,          -- 22% CORE: Δposts/Δtime under hashtag over 6h
  hashtag_post_count_velocity_24h FLOAT NOT NULL DEFAULT 0,          -- 22% CORE: Δposts/Δtime under hashtag over 24h
  song_audio_breakout_boolean     BOOLEAN NOT NULL DEFAULT FALSE,    -- 20% CORE: breakout songs get 1.5× multiplier
  engagement_velocity             FLOAT NOT NULL DEFAULT 0,          -- 18% CORE: (Δlikes×0.3 + Δcomments×0.4 + Δshares×0.3) / Δtime

  -- HIGH signals (12% + 10% + 8% = 30%)
  region_spread_score             INTEGER NOT NULL DEFAULT 0,        -- 12% HIGH: [NEW] distinct regions where hashtag/audio is in top 100
  hashtag_trendline_shape         hashtag_trendline_enum NOT NULL DEFAULT 'linear',  -- 10% HIGH: exponential/linear/plateauing/declining
  creator_amplification_score     FLOAT NOT NULL DEFAULT 0,          -- 8% HIGH: [NEW] weighted sum of creator_follower_count × creator_engagement_rate for top 5

  -- MEDIUM signals (6% + 4% = 10%)
  cross_entity_spread             INTEGER NOT NULL DEFAULT 0,        -- 6% MEDIUM: count of entity types (hashtag/audio/format) carrying same trend
  trend_direction                 trend_direction_enum NOT NULL DEFAULT 'RISING',  -- 4% MEDIUM: compare 3 snapshots at T, T-6h, T-12h

  -- LOW (metadata only, NOT a scoring input)
  video_sort_mode                 VARCHAR(50),                       -- store as metadata for reproducibility

  -- Metadata
  trending_audio_id               VARCHAR(255),
  hashtag_names                   TEXT[],
  platform_score                  FLOAT,                             -- computed platform-level score 0–100

  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Twitter/X Signals Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS twitter_signals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id                    UUID NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CORE signals (28% + 22% = 50%)
  mention_velocity_5min       FLOAT NOT NULL DEFAULT 0,              -- 28% CORE: Δmatching posts over 5-min window (catches flash trends)
  mention_velocity_15min      FLOAT NOT NULL DEFAULT 0,              -- 28% CORE: Δmatching posts over 15-min window
  mention_velocity_60min      FLOAT NOT NULL DEFAULT 0,              -- 28% CORE: Δmatching posts over 60-min window
  engagement_velocity         FLOAT NOT NULL DEFAULT 0,              -- 22% CORE: reposts×0.4 + replies×0.35 + likes×0.25 / Δtime

  -- HIGH signals (15% + 12% + 10% = 37%)
  tweet_volume                INTEGER,                               -- 15% HIGH: NULL = not reported (distinct from 0 = zero volume)
  woeid_count                 INTEGER NOT NULL DEFAULT 0,            -- 12% HIGH: international spread; 5+ WOEIDs = elevated priority
  novelty_score               FLOAT NOT NULL DEFAULT 100,            -- 10% HIGH: [NEW] 0–100; down-rank topics from last 30 days
  repeated_appearance_count   INTEGER NOT NULL DEFAULT 0,            -- supporting field for novelty_score

  -- MEDIUM signals (8% + 3% = 11%)
  query_cluster_id            UUID,                                  -- 8% MEDIUM: group semantic variants to avoid double-counting
  trend_created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- 3% MEDIUM: freshness decay input; penalize trends older than 6h on X

  -- LOW signals (2%)
  flash_trend_flag            BOOLEAN NOT NULL DEFAULT FALSE,        -- 2% LOW: true if appeared in only 1 snapshot (often noise)

  -- Metadata
  woeid_list                  INTEGER[],                             -- list of WOEIDs where trend is active
  platform_score              FLOAT,                                 -- computed platform-level score 0–100

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LinkedIn Signals Table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS linkedin_signals (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id                        UUID NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CORE signals (30% + 25% + 18% = 73%)
  impression_velocity_1h          FLOAT NOT NULL DEFAULT 0,          -- 30% CORE: earliest breakout signal on LinkedIn
  share_repost_velocity           FLOAT NOT NULL DEFAULT 0,          -- 25% CORE: shares weighted 2× vs reactions (rarity + spread power)
  comment_velocity                FLOAT NOT NULL DEFAULT 0,          -- 18% CORE: comment velocity > reaction velocity as quality signal

  -- HIGH signals (10% + 8% = 18%)
  professional_diversity_score    INTEGER NOT NULL DEFAULT 0,        -- 10% HIGH: [NEW] count of distinct job titles/industries posting on same topic in last 24h
  impression_to_view_ratio        FLOAT NOT NULL DEFAULT 0,          -- 8% HIGH: proxy for video watch time for third-party content

  -- MEDIUM signals (5%)
  reaction_velocity               FLOAT NOT NULL DEFAULT 0,          -- 5% MEDIUM: Δreactions/Δtime (not raw count)
  insightful_reaction_count       INTEGER NOT NULL DEFAULT 0,        -- supporting: 'Insightful' reactions signal professional value

  -- LOW signals (supplementary only, NOT primary scoring inputs)
  creator_amplification_score     FLOAT,                             -- 3% LOW: for creator scoring only, not trend scoring
  hashtag_frequency_in_text       INTEGER NOT NULL DEFAULT 0,        -- 1% LOW: supplementary topic tagging only

  -- Metadata
  topic_keywords                  TEXT[],
  platform_score                  FLOAT,                             -- computed platform-level score 0–100

  -- DE-PRIORITIZED signals (not stored as separate columns):
  -- profile_views/follower_delta: moved to creator_amplification_score only

  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Platform Historical Max Velocity Table ───────────────────────────────────
-- Used for normalizing Creator Velocity Score per platform.
-- Update weekly as a rolling max.

CREATE TABLE IF NOT EXISTS platform_velocity_baselines (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform                        platform_enum NOT NULL UNIQUE,
  historical_max_velocity         FLOAT NOT NULL DEFAULT 1.0,        -- rolling max creator velocity per platform
  last_updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default baselines (update weekly via cron job)
INSERT INTO platform_velocity_baselines (platform, historical_max_velocity) VALUES
  ('instagram',    500.0),
  ('youtube',      300.0),
  ('google_trends', 200.0),
  ('reddit',       400.0),
  ('tiktok',       800.0),
  ('twitter',      600.0),
  ('linkedin',     150.0)
ON CONFLICT (platform) DO NOTHING;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Core trend records indexes
CREATE INDEX IF NOT EXISTS idx_trend_records_platform ON trend_records(platform);
CREATE INDEX IF NOT EXISTS idx_trend_records_niche ON trend_records(niche);
CREATE INDEX IF NOT EXISTS idx_trend_records_status ON trend_records(status);
CREATE INDEX IF NOT EXISTS idx_trend_records_nemo_score ON trend_records(nemo_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_records_is_expired ON trend_records(is_expired);
CREATE INDEX IF NOT EXISTS idx_trend_records_first_detected ON trend_records(first_detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_records_collected_at ON trend_records(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_records_query_cluster ON trend_records(query_cluster_id);
CREATE INDEX IF NOT EXISTS idx_trend_records_topic_text ON trend_records USING gin(to_tsvector('english', topic_text));

-- Platform signal indexes
CREATE INDEX IF NOT EXISTS idx_instagram_signals_trend_id ON instagram_signals(trend_id);
CREATE INDEX IF NOT EXISTS idx_youtube_signals_trend_id ON youtube_signals(trend_id);
CREATE INDEX IF NOT EXISTS idx_google_trends_signals_trend_id ON google_trends_signals(trend_id);
CREATE INDEX IF NOT EXISTS idx_reddit_signals_trend_id ON reddit_signals(trend_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_signals_trend_id ON tiktok_signals(trend_id);
CREATE INDEX IF NOT EXISTS idx_twitter_signals_trend_id ON twitter_signals(trend_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_signals_trend_id ON linkedin_signals(trend_id);

-- ─── Auto-update updated_at trigger ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trend_records_updated_at
  BEFORE UPDATE ON trend_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Auto-compute trend_age_hours trigger ────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_trend_age_hours()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trend_age_hours = EXTRACT(EPOCH FROM (NOW() - NEW.first_detected_at)) / 3600;
  NEW.is_expired = NEW.trend_age_hours > 168;
  IF NEW.is_expired THEN
    NEW.status = 'EXPIRED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compute_trend_age
  BEFORE INSERT OR UPDATE ON trend_records
  FOR EACH ROW EXECUTE FUNCTION compute_trend_age_hours();
`;

/**
 * TypeScript representation of the schema for documentation and validation.
 * Use NEMO_SCHEMA_SQL above for actual database migrations.
 */
export const SCHEMA_VERSION = '1.0.0';
export const SCHEMA_DATE = '2026-07-14';

/**
 * Platform weight constants for Cross-Platform Score.
 * These are the authoritative values — must match PLATFORM_WEIGHTS in types.ts.
 */
export const SCHEMA_PLATFORM_WEIGHTS = {
  tiktok: 0.22,
  instagram: 0.2,
  youtube: 0.2,
  google_trends: 0.18,
  twitter: 0.12,
  reddit: 0.05,
  linkedin: 0.03,
} as const;

/**
 * Nemo Score formula weights.
 * These are the authoritative values — must match NEMO_SCORE_WEIGHTS in types.ts.
 */
export const SCHEMA_NEMO_SCORE_WEIGHTS = {
  creator_velocity: 0.25, // 25%
  spike_score: 0.3, // 30%
  cross_platform: 0.25, // 25%
  freshness: 0.2, // 20%
} as const;

/**
 * New signals added in this version (v1.0).
 * These were missing from the original spec.
 */
export const NEW_SIGNALS_V1 = [
  { platform: 'instagram', signal: 'audio_reuse_velocity', tier: 'HIGH', weight: '10%' },
  { platform: 'youtube', signal: 'topic_cluster_score', tier: 'HIGH', weight: '8%' },
  { platform: 'youtube', signal: 'traffic_source_weight', tier: 'MEDIUM', weight: '4%' },
  { platform: 'google_trends', signal: 'geo_spread_score', tier: 'HIGH', weight: '8%' },
  { platform: 'google_trends', signal: 'query_cluster_id', tier: 'LOW', weight: '0%' },
  { platform: 'reddit', signal: 'comment_keyword_cluster', tier: 'MEDIUM', weight: '5%' },
  { platform: 'tiktok', signal: 'region_spread_score', tier: 'HIGH', weight: '12%' },
  { platform: 'tiktok', signal: 'creator_amplification_score', tier: 'HIGH', weight: '8%' },
  { platform: 'twitter', signal: 'novelty_score', tier: 'HIGH', weight: '10%' },
  { platform: 'linkedin', signal: 'professional_diversity_score', tier: 'HIGH', weight: '10%' },
  { platform: 'all', signal: 'cross_platform_score', tier: 'CORE', weight: '25% of Nemo Score' },
  { platform: 'all', signal: 'freshness_multiplier', tier: 'CORE', weight: 'Final multiplier' },
] as const;

/**
 * Signals removed or de-prioritized in this version (v1.0).
 */
export const REMOVED_SIGNALS_V1 = [
  {
    platform: 'instagram',
    signal: 'accounts_reached',
    reason: 'Account management metric only; not available for third-party content',
  },
  {
    platform: 'instagram',
    signal: 'active_times',
    reason: "Belongs in 'best time to post' feature, not trend detection",
  },
  {
    platform: 'youtube',
    signal: 'shares_count',
    reason: 'Unreliable signal; invest in comment velocity instead',
  },
  {
    platform: 'linkedin',
    signal: 'hashtag_frequency_in_text',
    reason: 'De-prioritized to supplementary only; LinkedIn users use hashtags inconsistently',
  },
  {
    platform: 'linkedin',
    signal: 'profile_views_follower_delta',
    reason: 'Moved to creator_amplification_score only; lags trend detection',
  },
] as const;
