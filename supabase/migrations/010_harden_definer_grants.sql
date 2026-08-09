-- Harden SECURITY DEFINER execute grants + search_path for trigger/helpers.
-- purge_analytics: service_role only (called from Vercel cron via service role).
-- increment_ai_usage: authenticated + service_role (anon revoked).
-- handle_new_user: trigger-only; revoke API execute from anon/authenticated.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.purge_analytics_older_than_90_days() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_analytics_older_than_90_days() FROM anon;
REVOKE ALL ON FUNCTION public.purge_analytics_older_than_90_days() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_analytics_older_than_90_days() TO service_role;

REVOKE ALL ON FUNCTION public.increment_ai_usage(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_ai_usage(TEXT, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(TEXT, INTEGER) TO service_role;

-- Optional helper sometimes present on projects; lock down if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated';
  END IF;
END $$;
