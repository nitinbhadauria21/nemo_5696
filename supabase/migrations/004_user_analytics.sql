-- User activity analytics: events + sessions
-- Admin reads use service role (bypasses RLS). Authenticated users can insert/select own rows.

CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT,
  page_path TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_events_user_id_created_at_idx
  ON user_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_events_event_name_created_at_idx
  ON user_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS user_events_created_at_idx
  ON user_events (created_at DESC);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  page_count INTEGER NOT NULL DEFAULT 0,
  device TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_last_seen_idx
  ON user_sessions (user_id, last_seen_at DESC);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users: insert own events (user_id must match or be null for anon-ish)
DROP POLICY IF EXISTS "Users insert own events" ON user_events;
CREATE POLICY "Users insert own events"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users select own events" ON user_events;
CREATE POLICY "Users select own events"
  ON user_events FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users insert own sessions" ON user_sessions;
CREATE POLICY "Users insert own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR (SELECT auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users select own sessions" ON user_sessions;
CREATE POLICY "Users select own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own sessions" ON user_sessions;
CREATE POLICY "Users update own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Grants for Data API exposure (service_role bypasses RLS for admin reads/inserts)
GRANT SELECT, INSERT ON user_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT ALL ON user_events TO service_role;
GRANT ALL ON user_sessions TO service_role;

COMMENT ON TABLE user_events IS 'Append-only activity log. Admin panel reads via service role.';
COMMENT ON TABLE user_sessions IS 'Lightweight session touch records. Admin panel reads via service role.';
