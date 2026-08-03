-- Product tables for production-complete Supabase integration

CREATE TABLE IF NOT EXISTS saved_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT,
  trend_id TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS saved_scripts_user_id_idx ON saved_scripts (user_id, created_at DESC);
ALTER TABLE saved_scripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scripts" ON saved_scripts;
CREATE POLICY "Users manage own scripts" ON saved_scripts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generation_type TEXT NOT NULL,
  model TEXT,
  trend_id TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  tokens_estimate INTEGER,
  error TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_generations_user_id_idx ON ai_generations (user_id, created_at DESC);
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own ai generations" ON ai_generations;
CREATE POLICY "Users read own ai generations" ON ai_generations FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own ai generations" ON ai_generations;
CREATE POLICY "Users insert own ai generations" ON ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE TABLE IF NOT EXISTS collector_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  trend_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE collector_runs ENABLE ROW LEVEL SECURITY;
-- Service role only for writes; authenticated users can read recent runs
DROP POLICY IF EXISTS "Authenticated read collector runs" ON collector_runs;
CREATE POLICY "Authenticated read collector runs" ON collector_runs FOR SELECT
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS trend_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trend_id TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('useful', 'not_useful', 'dismissed')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, trend_id)
);
ALTER TABLE trend_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own feedback" ON trend_feedback;
CREATE POLICY "Users manage own feedback" ON trend_feedback FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  page_path TEXT,
  result_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS search_queries_user_id_idx ON search_queries (user_id, created_at DESC);
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own searches" ON search_queries;
CREATE POLICY "Users insert own searches" ON search_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Users read own searches" ON search_queries;
CREATE POLICY "Users read own searches" ON search_queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_digest BOOLEAN NOT NULL DEFAULT true,
  trend_alerts BOOLEAN NOT NULL DEFAULT true,
  product_updates BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notification prefs" ON notification_prefs;
CREATE POLICY "Users manage own notification prefs" ON notification_prefs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON saved_scripts TO authenticated;
GRANT SELECT, INSERT ON ai_generations TO authenticated;
GRANT SELECT ON collector_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trend_feedback TO authenticated;
GRANT SELECT, INSERT ON search_queries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_prefs TO authenticated;
GRANT ALL ON saved_scripts TO service_role;
GRANT ALL ON ai_generations TO service_role;
GRANT ALL ON collector_runs TO service_role;
GRANT ALL ON trend_feedback TO service_role;
GRANT ALL ON search_queries TO service_role;
GRANT ALL ON notification_prefs TO service_role;
