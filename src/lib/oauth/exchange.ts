import { createHash, randomBytes } from 'crypto';
import {
  getProviderConfig,
  resolveEnv,
  type ProviderOAuthConfig,
} from '@/lib/oauth/providers';
import type { SealedTokens } from '@/lib/crypto/sealTokens';

export type TokenExchangeResult =
  | { ok: true; tokens: SealedTokens; expiresAt: string | null; scopes: string[] }
  | { ok: false; error: string };

function pkceChallengeFromVerifier(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/** Build authorize URL with correct scopes and extras. */
export function buildAuthorizeUrl(opts: {
  provider: string;
  redirectUri: string;
  state: string;
  /** For Twitter PKCE — store verifier in state or cookie */
  codeVerifier?: string;
}): { url: string; codeVerifier?: string } | { error: string } {
  const cfg = getProviderConfig(opts.provider);
  if (!cfg) return { error: 'unsupported_provider' };
  const clientId = resolveEnv(cfg.clientIdEnv);
  if (!clientId) return { error: 'not_configured' };

  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', opts.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', cfg.scopes.join(' '));
  url.searchParams.set('state', opts.state);

  let codeVerifier = opts.codeVerifier;
  if (cfg.id === 'twitter') {
    codeVerifier = codeVerifier || randomBytes(32).toString('base64url');
    url.searchParams.set('code_challenge', pkceChallengeFromVerifier(codeVerifier));
    url.searchParams.set('code_challenge_method', 'S256');
  }

  if (cfg.authorizeExtras) {
    for (const [k, v] of Object.entries(cfg.authorizeExtras)) {
      if (k === 'code_challenge_method') continue; // handled for twitter
      url.searchParams.set(k, v);
    }
  }

  return { url: url.toString(), codeVerifier };
}

async function postTokenForm(
  cfg: ProviderOAuthConfig,
  body: Record<string, string>
): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string }> {
  const clientId = resolveEnv(cfg.clientIdEnv);
  const clientSecret = resolveEnv(cfg.clientSecretEnv);
  if (!clientId || !clientSecret) {
    return { ok: false, error: 'missing_client_credentials' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  const params = new URLSearchParams({ ...body, client_id: clientId });

  if (cfg.id === 'twitter') {
    // Confidential client: Basic auth
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  } else if (cfg.id === 'instagram') {
    params.set('client_secret', clientSecret);
  } else {
    params.set('client_secret', clientSecret);
  }

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { ok: false, error: `token_non_json:${res.status}` };
  }

  if (!res.ok) {
    const msg =
      (json.error_description as string) ||
      (json.error as string) ||
      (json.message as string) ||
      `token_http_${res.status}`;
    return { ok: false, error: String(msg) };
  }

  return { ok: true, json };
}

/**
 * Exchange authorization code for access (+ refresh) tokens.
 * Returns structured tokens for sealing — never returns fake success.
 */
export async function exchangeAuthorizationCode(opts: {
  provider: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string | null;
}): Promise<TokenExchangeResult> {
  const cfg = getProviderConfig(opts.provider);
  if (!cfg) return { ok: false, error: 'unsupported_provider' };

  const body: Record<string, string> = {
    code: opts.code,
    redirect_uri: opts.redirectUri,
    grant_type: 'authorization_code',
  };
  if (opts.codeVerifier) body.code_verifier = opts.codeVerifier;

  // TikTok uses client_key naming
  if (cfg.id === 'tiktok') {
    const clientKey = resolveEnv(cfg.clientIdEnv);
    const clientSecret = resolveEnv(cfg.clientSecretEnv);
    if (!clientKey || !clientSecret) return { ok: false, error: 'missing_client_credentials' };
    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: opts.code,
        grant_type: 'authorization_code',
        redirect_uri: opts.redirectUri,
      }).toString(),
    });
    const json = (await res.json()) as Record<string, unknown>;
    const data = (json.data as Record<string, unknown>) || json;
    if (!res.ok || !data.access_token) {
      return {
        ok: false,
        error: String(json.error || json.message || 'tiktok_token_failed'),
      };
    }
    const expiresIn = Number(data.expires_in || 0);
    return {
      ok: true,
      tokens: {
        access_token: String(data.access_token),
        refresh_token: data.refresh_token ? String(data.refresh_token) : undefined,
        expires_in: expiresIn || undefined,
        raw: data,
      },
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      scopes: String(data.scope || cfg.scopes.join(',')).split(/[,\s]+/).filter(Boolean),
    };
  }

  const result = await postTokenForm(cfg, body);
  if (!result.ok) return result;

  const json = result.json;
  // Instagram short-lived may return { access_token, user_id }
  const access =
    (json.access_token as string) ||
    ((json.data as { access_token?: string } | undefined)?.access_token);
  if (!access) return { ok: false, error: 'no_access_token_in_response' };

  const expiresIn = Number(json.expires_in || 0);
  return {
    ok: true,
    tokens: {
      access_token: access,
      refresh_token: json.refresh_token ? String(json.refresh_token) : undefined,
      id_token: json.id_token ? String(json.id_token) : undefined,
      token_type: json.token_type ? String(json.token_type) : undefined,
      expires_in: expiresIn || undefined,
      raw: json,
    },
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    scopes: String(json.scope || cfg.scopes.join(' '))
      .split(/[,\s]+/)
      .filter(Boolean),
  };
}
