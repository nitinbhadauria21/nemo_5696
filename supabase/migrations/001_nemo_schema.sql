-- Nemo schema migration for Supabase / Postgres
-- Apply in Supabase SQL editor when NEXT_PUBLIC_SUPABASE_* is configured.

-- Profiles (auth preferences + billing)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  niches TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  ai_usage_count INTEGER NOT NULL DEFAULT 0,
  ai_usage_period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Core trend tables (from src/lib/signals/schema.ts — abbreviated apply)
DO $$ BEGIN
  CREATE TYPE platform_enum AS ENUM (
    'instagram','youtube','google_trends','reddit','tiktok','twitter','linkedin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trend_status_enum AS ENUM (
    'RISING','PEAKING','DECLINING','PREDICTED','EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trend_niche_enum AS ENUM (
    'AI','fitness','finance','fashion','gaming','movies','education','startups',
    'travel','food','sports','marketing','productivity','business','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS trend_records (
  trend_id                  TEXT PRIMARY KEY,
  topic_text                VARCHAR(500) NOT NULL,
  platform                  platform_enum NOT NULL,
  niche                     trend_niche_enum NOT NULL DEFAULT 'other',
  first_detected_at         TIMESTAMPTZ NOT NULL,
  collected_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trend_age_hours           FLOAT NOT NULL DEFAULT 0,
  creator_velocity_score    FLOAT NOT NULL DEFAULT 0,
  spike_score               FLOAT NOT NULL DEFAULT 0,
  cross_platform_score      FLOAT NOT NULL DEFAULT 0,
  freshness_score           FLOAT NOT NULL DEFAULT 0,
  freshness_multiplier      FLOAT NOT NULL DEFAULT 1.0,
  nemo_score                FLOAT NOT NULL DEFAULT 0,
  status                    trend_status_enum NOT NULL DEFAULT 'PREDICTED',
  platforms_present         platform_enum[] NOT NULL DEFAULT '{}',
  is_expired                BOOLEAN NOT NULL DEFAULT FALSE,
  geo_regions               TEXT[],
  breakout_boolean          BOOLEAN,
  mentions_last_24h         INTEGER,
  mentions_prev_24h         INTEGER,
  creators_last_6h          INTEGER,
  creators_last_24h         INTEGER,
  creators_last_72h         INTEGER,
  raw_platform_data         JSONB
);

CREATE INDEX IF NOT EXISTS idx_trend_records_nemo_score ON trend_records (nemo_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_records_collected_at ON trend_records (collected_at DESC);

CREATE TABLE IF NOT EXISTS platform_velocity_baselines (
  platform                  platform_enum PRIMARY KEY,
  historical_max_creators_24h FLOAT NOT NULL DEFAULT 100,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
