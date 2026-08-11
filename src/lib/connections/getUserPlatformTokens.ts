import { createAdminClient } from '@/lib/supabase/admin';
import { unsealTokens, sealTokens, type SealedTokens } from '@/lib/crypto/sealTokens';
import { getProviderConfig, resolveEnv } from '@/lib/oauth/providers';

/**
 * Server-only: load decrypted OAuth tokens for a user's connected platform.
 * Used later for personalized signals — NOT for global trend cron.
 */
export async function getUserPlatformTokens(
  userId: string,
  platform: string
): Promise<SealedTokens | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from('user_connections')
    .select('encrypted_tokens, metadata, status, token_expires_at')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status && data.status !== 'active') return null;

  const sealed =
    data.encrypted_tokens || (data.metadata as { sealed_legacy?: string } | null)?.sealed_legacy;
  if (!sealed || typeof sealed !== 'string') return null;

  try {
    const tokens = unsealTokens(sealed);
    const expiresAt = data.token_expires_at ? new Date(data.token_expires_at).getTime() : 0;
    const needsRefresh =
      Boolean(tokens.refresh_token) && expiresAt > 0 && expiresAt < Date.now() + 120_000;
    if (needsRefresh && tokens.refresh_token) {
      const refreshed = await refreshAndReseal(userId, platform, tokens.refresh_token);
      if (refreshed) return refreshed;
    }
    return tokens;
  } catch {
    return null;
  }
}

/** Long-term: refresh expired access tokens and rewrite sealed vault. */
async function refreshAndReseal(
  userId: string,
  platform: string,
  refreshToken: string
): Promise<SealedTokens | null> {
  const cfg = getProviderConfig(platform);
  if (!cfg) return null;
  const clientId = resolveEnv(cfg.clientIdEnv);
  const clientSecret = resolveEnv(cfg.clientSecretEnv);
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok || !json.access_token) {
      console.error('[oauth] refresh failed', platform, json.error || res.status);
      return null;
    }
    const next: SealedTokens = {
      access_token: String(json.access_token),
      refresh_token: json.refresh_token ? String(json.refresh_token) : refreshToken,
      expires_in: Number(json.expires_in || 0) || undefined,
      token_type: json.token_type ? String(json.token_type) : undefined,
    };
    const sealed = sealTokens(next);
    const expiresIn = Number(json.expires_in || 0);
    const admin = createAdminClient();
    if (admin) {
      await admin
        .from('user_connections')
        .update({
          encrypted_tokens: sealed,
          token_expires_at: expiresIn
            ? new Date(Date.now() + expiresIn * 1000).toISOString()
            : null,
          status: 'active',
          metadata: {
            connected: true,
            token_status: 'active',
            has_refresh: true,
            refreshed_at: new Date().toISOString(),
          },
        })
        .eq('user_id', userId)
        .eq('platform', platform);
    }
    return next;
  } catch (err) {
    console.error('[oauth] refresh exception', platform, err);
    return null;
  }
}
