-- Long-term OAuth: encrypted credential column (never return to clients via RLS select of this col for anon)
-- App reads/writes via service role or authenticated update of own row.

ALTER TABLE user_connections
  ADD COLUMN IF NOT EXISTS encrypted_tokens TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'error', 'revoked'));

COMMENT ON COLUMN user_connections.encrypted_tokens IS
  'AES-256-GCM sealed JSON {access_token, refresh_token?, id_token?}. Never expose to browser.';
COMMENT ON COLUMN user_connections.status IS
  'active only after successful code→token exchange';

-- Tighten: clients should not need encrypted_tokens. Keep SELECT * for own rows but API must omit column.
GRANT SELECT, INSERT, UPDATE, DELETE ON user_connections TO authenticated;
GRANT ALL ON user_connections TO service_role;
