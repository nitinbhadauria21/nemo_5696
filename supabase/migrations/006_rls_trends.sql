-- RLS for shared trend tables: authenticated read; writes via service role only
ALTER TABLE trend_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_velocity_baselines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read trends" ON trend_records;
CREATE POLICY "Authenticated users can read trends"
  ON trend_records FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read baselines" ON platform_velocity_baselines;
CREATE POLICY "Authenticated users can read baselines"
  ON platform_velocity_baselines FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON trend_records TO authenticated;
GRANT SELECT ON platform_velocity_baselines TO authenticated;
GRANT ALL ON trend_records TO service_role;
GRANT ALL ON platform_velocity_baselines TO service_role;
