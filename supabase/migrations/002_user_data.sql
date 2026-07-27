-- Bookmarks, queue, API keys, user connections
CREATE TABLE IF NOT EXISTS trend_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trend_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, trend_id)
);

ALTER TABLE trend_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON trend_bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ideas' CHECK (status IN ('ideas', 'drafting', 'ready', 'published')),
  platform TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own queue" ON queue_items FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own api keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE (user_id, platform)
);

ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own connections" ON user_connections FOR ALL USING (auth.uid() = user_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS connected_socials TEXT[] DEFAULT '{}';
