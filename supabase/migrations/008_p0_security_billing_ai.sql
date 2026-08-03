-- P0 security: atomic AI quota, billing orders, admin flag, webhook idempotency

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS billing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'agency')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'paid', 'failed', 'refunded', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS billing_orders_user_id_idx ON billing_orders (user_id, created_at DESC);
ALTER TABLE billing_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own billing orders" ON billing_orders;
CREATE POLICY "Users read own billing orders" ON billing_orders FOR SELECT
  USING (auth.uid() = user_id);
-- Writes via service role only
GRANT SELECT ON billing_orders TO authenticated;
GRANT ALL ON billing_orders TO service_role;

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON billing_webhook_events TO service_role;

-- Atomic AI usage increment: returns allowed=false without incrementing when over limit
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_period TEXT, p_limit INTEGER)
RETURNS TABLE(allowed BOOLEAN, used INTEGER, lim INTEGER, plan TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_plan TEXT;
  v_count INTEGER;
  v_period TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 0, p_limit, 'free'::text;
    RETURN;
  END IF;

  SELECT COALESCE(pr.plan, 'free'), COALESCE(pr.ai_usage_count, 0), COALESCE(pr.ai_usage_period, '')
  INTO v_plan, v_count, v_period
  FROM profiles pr
  WHERE pr.id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, p_limit, 'free'::text;
    RETURN;
  END IF;

  IF v_period IS DISTINCT FROM p_period THEN
    v_count := 0;
  END IF;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, v_count, p_limit, v_plan;
    RETURN;
  END IF;

  v_count := v_count + 1;
  UPDATE profiles
  SET ai_usage_count = v_count,
      ai_usage_period = p_period,
      updated_at = NOW()
  WHERE id = v_uid;

  RETURN QUERY SELECT true, v_count, p_limit, v_plan;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_usage(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(TEXT, INTEGER) TO service_role;
