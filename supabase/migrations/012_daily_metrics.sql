-- Phase 3: daily rollups for fast admin charts

CREATE TABLE IF NOT EXISTS daily_metrics (
  day DATE PRIMARY KEY,
  dau INTEGER NOT NULL DEFAULT 0,
  wau INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  paying_users INTEGER NOT NULL DEFAULT 0,
  script_gens INTEGER NOT NULL DEFAULT 0,
  scripts_saved INTEGER NOT NULL DEFAULT 0,
  searches INTEGER NOT NULL DEFAULT 0,
  carousels INTEGER NOT NULL DEFAULT 0,
  carousel_exports INTEGER NOT NULL DEFAULT 0,
  ai_calls INTEGER NOT NULL DEFAULT 0,
  ai_success INTEGER NOT NULL DEFAULT 0,
  ai_cost_usd_est NUMERIC(14, 6) NOT NULL DEFAULT 0,
  active_ms_total BIGINT NOT NULL DEFAULT 0,
  est_mrr INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
-- Admin reads via service_role only
GRANT ALL ON daily_metrics TO service_role;

COMMENT ON TABLE daily_metrics IS 'One row per day — admin analytics rollups. Keep ~2 years.';

-- Helper: refresh a single day (callable from ops cron via service_role)
CREATE OR REPLACE FUNCTION public.refresh_daily_metrics(target_day DATE DEFAULT (CURRENT_DATE - 1))
RETURNS daily_metrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_start TIMESTAMPTZ := target_day::timestamptz;
  day_end TIMESTAMPTZ := (target_day + 1)::timestamptz;
  week_start TIMESTAMPTZ := (target_day - 6)::timestamptz;
  result_row daily_metrics;
  v_dau INTEGER;
  v_wau INTEGER;
  v_signups INTEGER;
  v_paying INTEGER;
  v_script_gens INTEGER;
  v_scripts_saved INTEGER;
  v_searches INTEGER;
  v_carousels INTEGER;
  v_carousel_exports INTEGER;
  v_ai_calls INTEGER;
  v_ai_success INTEGER;
  v_ai_cost NUMERIC(14, 6);
  v_active_ms BIGINT;
  v_est_mrr INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO v_dau
  FROM user_events
  WHERE created_at >= day_start AND created_at < day_end AND user_id IS NOT NULL;

  SELECT COUNT(DISTINCT user_id) INTO v_wau
  FROM user_events
  WHERE created_at >= week_start AND created_at < day_end AND user_id IS NOT NULL;

  SELECT COUNT(*) INTO v_signups
  FROM profiles
  WHERE created_at >= day_start AND created_at < day_end;

  SELECT COUNT(*) INTO v_paying
  FROM profiles
  WHERE plan IN ('pro', 'agency');

  SELECT COUNT(*) INTO v_script_gens
  FROM script_generations
  WHERE created_at >= day_start AND created_at < day_end;

  SELECT COUNT(*) INTO v_scripts_saved
  FROM saved_scripts
  WHERE created_at >= day_start AND created_at < day_end;

  SELECT COUNT(*) INTO v_searches
  FROM search_queries
  WHERE created_at >= day_start AND created_at < day_end;

  SELECT COUNT(*) INTO v_carousels
  FROM carousel_projects
  WHERE created_at >= day_start AND created_at < day_end;

  SELECT COUNT(*) INTO v_carousel_exports
  FROM carousel_projects
  WHERE exported = true AND updated_at >= day_start AND updated_at < day_end;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE success = true),
         COALESCE(SUM(cost_usd_est), 0)
  INTO v_ai_calls, v_ai_success, v_ai_cost
  FROM ai_generations
  WHERE created_at >= day_start AND created_at < day_end;

  SELECT COALESCE(SUM(active_ms), 0) INTO v_active_ms
  FROM user_sessions
  WHERE last_seen_at >= day_start AND last_seen_at < day_end;

  SELECT COALESCE(
    SUM(CASE WHEN plan = 'pro' THEN 999 WHEN plan = 'agency' THEN 4999 ELSE 0 END),
    0
  ) INTO v_est_mrr
  FROM profiles;

  INSERT INTO daily_metrics AS dm (
    day, dau, wau, signups, paying_users, script_gens, scripts_saved,
    searches, carousels, carousel_exports, ai_calls, ai_success,
    ai_cost_usd_est, active_ms_total, est_mrr, updated_at
  ) VALUES (
    target_day, v_dau, v_wau, v_signups, v_paying, v_script_gens, v_scripts_saved,
    v_searches, v_carousels, v_carousel_exports, v_ai_calls, v_ai_success,
    v_ai_cost, v_active_ms, v_est_mrr, NOW()
  )
  ON CONFLICT (day) DO UPDATE SET
    dau = EXCLUDED.dau,
    wau = EXCLUDED.wau,
    signups = EXCLUDED.signups,
    paying_users = EXCLUDED.paying_users,
    script_gens = EXCLUDED.script_gens,
    scripts_saved = EXCLUDED.scripts_saved,
    searches = EXCLUDED.searches,
    carousels = EXCLUDED.carousels,
    carousel_exports = EXCLUDED.carousel_exports,
    ai_calls = EXCLUDED.ai_calls,
    ai_success = EXCLUDED.ai_success,
    ai_cost_usd_est = EXCLUDED.ai_cost_usd_est,
    active_ms_total = EXCLUDED.active_ms_total,
    est_mrr = EXCLUDED.est_mrr,
    updated_at = NOW()
  RETURNING * INTO result_row;

  RETURN result_row;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_daily_metrics(DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_daily_metrics(DATE) FROM anon;
REVOKE ALL ON FUNCTION public.refresh_daily_metrics(DATE) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_daily_metrics(DATE) TO service_role;
