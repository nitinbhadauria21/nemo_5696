-- Historical trend snapshots for velocity / chart deltas (T, T-6h, T-12h)
CREATE TABLE IF NOT EXISTS trend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id TEXT NOT NULL REFERENCES trend_records(trend_id) ON DELETE CASCADE,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nemo_score FLOAT,
  creator_velocity_score FLOAT,
  spike_score FLOAT,
  cross_platform_score FLOAT,
  mentions_last_24h INTEGER,
  raw_platform_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_snapshots_trend_time ON trend_snapshots (trend_id, collected_at DESC);

-- Service role / cron can write; authenticated users read snapshots for trends they can see
ALTER TABLE trend_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read trend snapshots"
  ON trend_snapshots FOR SELECT
  TO authenticated
  USING (true);
