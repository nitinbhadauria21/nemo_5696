-- Deep Admin Analytics: schema, RLS, indexes, retention (Phase 1)
-- Project: tynyuntaebfqfnbyekxa
-- NEVER add a password column to public tables.

-- ─── Alter profiles ───────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- ─── Alter user_sessions ──────────────────────────────────────────────────────
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS active_ms BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_path TEXT,
  ADD COLUMN IF NOT EXISTS exit_path TEXT,
  ADD COLUMN IF NOT EXISTS browser TEXT,
  ADD COLUMN IF NOT EXISTS os TEXT;

-- ─── Alter ai_generations ─────────────────────────────────────────────────────
ALTER TABLE ai_generations
  ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS ttft_ms INTEGER,
  ADD COLUMN IF NOT EXISTS cost_usd_est NUMERIC(12, 6),
  ADD COLUMN IF NOT EXISTS task TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS model_used TEXT,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS ai_generations_task_created_at_idx
  ON ai_generations (task, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generations_model_used_created_at_idx
  ON ai_generations (model_used, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generations_created_at_idx
  ON ai_generations (created_at DESC);

-- ─── Alter saved_scripts (denormalized admin filters) ─────────────────────────
ALTER TABLE saved_scripts
  ADD COLUMN IF NOT EXISTS audience_type TEXT,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS framework TEXT,
  ADD COLUMN IF NOT EXISTS viral_score NUMERIC,
  ADD COLUMN IF NOT EXISTS mode TEXT;

-- Best-effort backfill from content jsonb (safe casts)
UPDATE saved_scripts SET
  audience_type = COALESCE(audience_type, content->>'audienceType', content->>'audience_type'),
  duration = COALESCE(duration, content->>'duration'),
  language = COALESCE(language, content->>'language'),
  framework = COALESCE(framework, content->>'frameworkLabel', content->>'framework'),
  viral_score = COALESCE(
    viral_score,
    CASE
      WHEN (content->>'viralScore') ~ '^[0-9]+(\.[0-9]+)?$' THEN (content->>'viralScore')::numeric
      WHEN (content->>'viral_score') ~ '^[0-9]+(\.[0-9]+)?$' THEN (content->>'viral_score')::numeric
      ELSE NULL
    END
  ),
  mode = COALESCE(mode, content->>'mode')
WHERE content IS NOT NULL
  AND (
    audience_type IS NULL OR duration IS NULL OR language IS NULL
    OR framework IS NULL OR viral_score IS NULL OR mode IS NULL
  );

-- ─── Alter search_queries ─────────────────────────────────────────────────────
ALTER TABLE search_queries
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS filters JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS search_queries_created_at_idx
  ON search_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS search_queries_query_lower_created_at_idx
  ON search_queries (lower(query), created_at DESC);
CREATE INDEX IF NOT EXISTS search_queries_source_created_at_idx
  ON search_queries (source, created_at DESC);

-- ─── script_generations (new) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS script_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mode TEXT,
  topic TEXT,
  audience_type TEXT,
  custom_audience TEXT,
  duration TEXT,
  scenes_count INTEGER,
  language TEXT,
  framework_label TEXT,
  viral_score NUMERIC,
  success BOOLEAN NOT NULL DEFAULT false,
  parse_ok BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER,
  provider TEXT,
  model TEXT,
  saved_script_id UUID REFERENCES saved_scripts(id) ON DELETE SET NULL,
  copied BOOLEAN NOT NULL DEFAULT false,
  preview TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS script_generations_user_id_created_at_idx
  ON script_generations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS script_generations_created_at_idx
  ON script_generations (created_at DESC);
CREATE INDEX IF NOT EXISTS script_generations_topic_lower_idx
  ON script_generations (lower(topic));

ALTER TABLE script_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own script generations" ON script_generations;
CREATE POLICY "Users insert own script generations"
  ON script_generations FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users select own script generations" ON script_generations;
CREATE POLICY "Users select own script generations"
  ON script_generations FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own script generations" ON script_generations;
CREATE POLICY "Users update own script generations"
  ON script_generations FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE ON script_generations TO authenticated;
GRANT ALL ON script_generations TO service_role;

COMMENT ON TABLE script_generations IS 'Viral Script Writer attempts (settings + metadata; preview ≤500). Full script body lives in saved_scripts.';

-- ─── carousel_projects (new) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carousel_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic TEXT,
  source TEXT,
  format TEXT,
  slide_count INTEGER NOT NULL DEFAULT 0,
  accent_color TEXT,
  template TEXT,
  slides_meta JSONB NOT NULL DEFAULT '[]'::jsonb,
  exported BOOLEAN NOT NULL DEFAULT false,
  export_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS carousel_projects_user_id_created_at_idx
  ON carousel_projects (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS carousel_projects_created_at_idx
  ON carousel_projects (created_at DESC);

ALTER TABLE carousel_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own carousels" ON carousel_projects;
CREATE POLICY "Users manage own carousels"
  ON carousel_projects FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON carousel_projects TO authenticated;
GRANT ALL ON carousel_projects TO service_role;

COMMENT ON TABLE carousel_projects IS 'Carousel Studio metadata only — no PNG blobs.';

-- ─── user_activity_summary (new) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_login_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  active_ms_7d BIGINT NOT NULL DEFAULT 0,
  active_ms_30d BIGINT NOT NULL DEFAULT 0,
  session_count_30d INTEGER NOT NULL DEFAULT 0,
  script_gens_30d INTEGER NOT NULL DEFAULT 0,
  scripts_saved_30d INTEGER NOT NULL DEFAULT 0,
  searches_30d INTEGER NOT NULL DEFAULT 0,
  carousels_30d INTEGER NOT NULL DEFAULT 0,
  ai_calls_30d INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_activity_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own activity summary" ON user_activity_summary;
CREATE POLICY "Users read own activity summary"
  ON user_activity_summary FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Writes via service_role / admin paths only (no user INSERT/UPDATE policy)
GRANT SELECT ON user_activity_summary TO authenticated;
GRANT ALL ON user_activity_summary TO service_role;

COMMENT ON TABLE user_activity_summary IS 'Per-user rollup for admin users table. No password fields.';

-- ─── api_request_logs (Phase 2 optional sampling) ─────────────────────────────
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  method TEXT,
  status INTEGER,
  latency_ms INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_request_logs_created_at_idx
  ON api_request_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS api_request_logs_route_created_at_idx
  ON api_request_logs (route, created_at DESC);

ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
-- service_role only (no policies for authenticated)
GRANT ALL ON api_request_logs TO service_role;

-- ─── Retention purge (extend) ─────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.purge_analytics_older_than_90_days();

CREATE OR REPLACE FUNCTION public.purge_analytics_older_than_90_days()
RETURNS TABLE(
  deleted_events BIGINT,
  deleted_sessions BIGINT,
  deleted_searches BIGINT,
  deleted_script_gens BIGINT,
  deleted_ai BIGINT,
  deleted_api_logs BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff TIMESTAMPTZ := NOW() - INTERVAL '90 days';
  e BIGINT;
  s BIGINT;
  q BIGINT;
  sg BIGINT;
  ai BIGINT;
  al BIGINT;
BEGIN
  DELETE FROM user_events WHERE created_at < cutoff;
  GET DIAGNOSTICS e = ROW_COUNT;
  DELETE FROM user_sessions WHERE started_at < cutoff;
  GET DIAGNOSTICS s = ROW_COUNT;
  DELETE FROM search_queries WHERE created_at < cutoff;
  GET DIAGNOSTICS q = ROW_COUNT;
  DELETE FROM script_generations WHERE created_at < cutoff;
  GET DIAGNOSTICS sg = ROW_COUNT;
  DELETE FROM ai_generations WHERE created_at < cutoff;
  GET DIAGNOSTICS ai = ROW_COUNT;
  DELETE FROM api_request_logs WHERE created_at < cutoff;
  GET DIAGNOSTICS al = ROW_COUNT;
  -- Keep saved_scripts, billing_orders, profiles, user_activity_summary, carousel_projects longer
  RETURN QUERY SELECT e, s, q, sg, ai, al;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_analytics_older_than_90_days() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_analytics_older_than_90_days() FROM anon;
REVOKE ALL ON FUNCTION public.purge_analytics_older_than_90_days() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_analytics_older_than_90_days() TO service_role;
