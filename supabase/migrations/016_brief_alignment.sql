-- 016_brief_alignment.sql
-- Lifecycle, multi-niche, clusters, platform signals, sources, alerts, weights, prefs.

-- Lifecycle enum
DO $$ BEGIN
  CREATE TYPE lifecycle_status_enum AS ENUM (
    'emerging','rising','breakout','trending','stable','fading','recycled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Metric availability triad
DO $$ BEGIN
  CREATE TYPE metric_availability_enum AS ENUM (
    'available','unavailable','estimated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE data_source_health_enum AS ENUM (
    'active','live','partial','unavailable','error','disabled','estimated','demo'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend trend_records with brief alignment columns
ALTER TABLE trend_records
  ADD COLUMN IF NOT EXISTS lifecycle_status lifecycle_status_enum DEFAULT 'emerging',
  ADD COLUMN IF NOT EXISTS niches TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS velocity_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acceleration_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS novelty_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS persistence_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS breakout_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS geo_spread_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cluster_id TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS why_trending JSONB DEFAULT '[]'::jsonb;

-- Backfill niches from single niche
UPDATE trend_records
SET niches = ARRAY[niche::text]
WHERE niches IS NULL OR cardinality(niches) = 0;

UPDATE trend_records
SET last_seen_at = COALESCE(last_seen_at, collected_at)
WHERE last_seen_at IS NULL;

-- Trend clusters
CREATE TABLE IF NOT EXISTS trend_clusters (
  cluster_id TEXT PRIMARY KEY,
  canonical_title TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  niche TEXT,
  niches TEXT[] DEFAULT '{}',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  member_count INTEGER NOT NULL DEFAULT 1,
  peak_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trend_clusters_last_seen ON trend_clusters (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_clusters_niche ON trend_clusters (niche);

-- Per-platform sub-scores
CREATE TABLE IF NOT EXISTS trend_platform_signals (
  id BIGSERIAL PRIMARY KEY,
  trend_id TEXT NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sub_score FLOAT DEFAULT 0,
  velocity FLOAT DEFAULT 0,
  acceleration FLOAT DEFAULT 0,
  engagement FLOAT DEFAULT 0,
  metric_availability metric_availability_enum DEFAULT 'available',
  raw JSONB DEFAULT '{}'::jsonb,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trend_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_tps_trend ON trend_platform_signals (trend_id);

-- Representative / attribution sources
CREATE TABLE IF NOT EXISTS trend_sources (
  id BIGSERIAL PRIMARY KEY,
  trend_id TEXT NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT,
  url TEXT,
  title TEXT,
  creator TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_availability metric_availability_enum DEFAULT 'available',
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_trend_sources_trend ON trend_sources (trend_id);
CREATE INDEX IF NOT EXISTS idx_trend_sources_platform ON trend_sources (platform);

-- Data source health
CREATE TABLE IF NOT EXISTS data_source_status (
  platform TEXT PRIMARY KEY,
  status data_source_health_enum NOT NULL DEFAULT 'unavailable',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  poll_interval_minutes INTEGER NOT NULL DEFAULT 30,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error TEXT,
  records_last_run INTEGER DEFAULT 0,
  metric_mode metric_availability_enum DEFAULT 'available',
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO data_source_status (platform, status, enabled, metric_mode, notes)
VALUES
  ('instagram', 'partial', true, 'estimated', 'Reels weighted higher when type known'),
  ('youtube', 'partial', true, 'available', 'Shorts + long'),
  ('google_trends', 'active', true, 'available', 'Rising vs breakout when API allows'),
  ('reddit', 'active', true, 'available', 'Live collector'),
  ('tiktok', 'partial', true, 'estimated', 'Honest gaps without official API'),
  ('linkedin', 'unavailable', true, 'unavailable', 'No fake live metrics'),
  ('twitter', 'estimated', true, 'estimated', 'Topics only; no synthetic as live'),
  ('facebook', 'partial', true, 'estimated', 'Extra platform; labeled in Sources'),
  ('x', 'estimated', true, 'estimated', 'Alias of twitter')
ON CONFLICT (platform) DO NOTHING;

-- Alert rules + in-app alerts
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Alert',
  niche TEXT,
  min_score FLOAT DEFAULT 60,
  lifecycle_status TEXT,
  require_cross_platform BOOLEAN DEFAULT FALSE,
  require_breakout BOOLEAN DEFAULT FALSE,
  platforms TEXT[] DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notify_browser BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON alert_rules (user_id);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  trend_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON alerts (user_id, created_at DESC);

-- Saved trends (promote bookmarks UX)
CREATE TABLE IF NOT EXISTS saved_trends (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trend_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, trend_id)
);

-- Scoring weights (tunable)
CREATE TABLE IF NOT EXISTS scoring_weights (
  id TEXT PRIMARY KEY DEFAULT 'default',
  freshness FLOAT NOT NULL DEFAULT 0.20,
  velocity FLOAT NOT NULL DEFAULT 0.18,
  acceleration FLOAT NOT NULL DEFAULT 0.12,
  cross_platform FLOAT NOT NULL DEFAULT 0.15,
  engagement FLOAT NOT NULL DEFAULT 0.12,
  novelty FLOAT NOT NULL DEFAULT 0.08,
  creator FLOAT NOT NULL DEFAULT 0.10,
  persistence FLOAT NOT NULL DEFAULT 0.05,
  breakout_modifier FLOAT NOT NULL DEFAULT 1.25,
  geo_spread_modifier FLOAT NOT NULL DEFAULT 1.10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

INSERT INTO scoring_weights (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- User preference fields on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_niche TEXT,
  ADD COLUMN IF NOT EXISTS default_time_window TEXT DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS default_region TEXT DEFAULT 'GLOBAL',
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT FALSE;

-- Indexes for filters / feeds
CREATE INDEX IF NOT EXISTS idx_trend_records_niche ON trend_records (niche);
CREATE INDEX IF NOT EXISTS idx_trend_records_niches ON trend_records USING GIN (niches);
CREATE INDEX IF NOT EXISTS idx_trend_records_status ON trend_records (status);
CREATE INDEX IF NOT EXISTS idx_trend_records_lifecycle ON trend_records (lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_trend_records_first_seen ON trend_records (first_detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_records_last_seen ON trend_records (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_records_platform ON trend_records (platform);
CREATE INDEX IF NOT EXISTS idx_trend_records_cluster ON trend_records (cluster_id);

-- RLS
ALTER TABLE trend_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_platform_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_weights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated read clusters" ON trend_clusters FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated read platform signals" ON trend_platform_signals FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated read trend sources" ON trend_sources FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated read data source status" ON data_source_status FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read data source status" ON data_source_status FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own alert rules" ON alert_rules FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own alerts" ON alerts FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own saved trends" ON saved_trends FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated read scoring weights" ON scoring_weights FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon can read trend enrichment tables (public dashboard)
DO $$ BEGIN
  CREATE POLICY "Anon read clusters" ON trend_clusters FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read trend sources" ON trend_sources FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
