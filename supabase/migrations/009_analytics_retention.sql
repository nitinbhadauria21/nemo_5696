-- Retention helpers: purge analytics older than 90 days (run via cron / pg_cron / ops job)

CREATE OR REPLACE FUNCTION public.purge_analytics_older_than_90_days()
RETURNS TABLE(deleted_events BIGINT, deleted_sessions BIGINT, deleted_searches BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff TIMESTAMPTZ := NOW() - INTERVAL '90 days';
  e BIGINT;
  s BIGINT;
  q BIGINT;
BEGIN
  DELETE FROM user_events WHERE created_at < cutoff;
  GET DIAGNOSTICS e = ROW_COUNT;
  DELETE FROM user_sessions WHERE started_at < cutoff;
  GET DIAGNOSTICS s = ROW_COUNT;
  DELETE FROM search_queries WHERE created_at < cutoff;
  GET DIAGNOSTICS q = ROW_COUNT;
  RETURN QUERY SELECT e, s, q;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_analytics_older_than_90_days() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_analytics_older_than_90_days() TO service_role;

-- billing_webhook_events: no client policies (service_role only via bypass)
-- Documented intentional: RLS on, zero policies for anon/authenticated.
