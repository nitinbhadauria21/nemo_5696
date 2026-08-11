/**
 * OAuth provider configs for user Social Connect (personalization).
 * Separate from app-level trend collectors (YOUTUBE_API_KEY, SERPAPI_KEY, etc.).
 */

export type OAuthProviderId =
  'google' | 'youtube' | 'linkedin' | 'instagram' | 'twitter' | 'tiktok';

export type ProviderOAuthConfig = {
  id: OAuthProviderId;
  authorizeUrl: string;
  tokenUrl: string;
  /** Env names for client id/secret */
  clientIdEnv: string[];
  clientSecretEnv: string[];
  scopes: string[];
  /** Extra authorize query params */
  authorizeExtras?: Record<string, string>;
  /** Form body style: google uses + json optional */
  tokenAuth?: 'body' | 'basic';
};

export const OAUTH_PROVIDERS: Record<string, ProviderOAuthConfig> = {
  google: {
    id: 'google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnv: ['GOOGLE_CLIENT_ID', 'OAUTH_CLIENT_ID'],
    clientSecretEnv: ['GOOGLE_CLIENT_SECRET', 'OAUTH_CLIENT_SECRET'],
    scopes: ['openid', 'email', 'profile'],
    authorizeExtras: { access_type: 'offline', prompt: 'consent' },
  },
  youtube: {
    id: 'youtube',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnv: ['GOOGLE_CLIENT_ID', 'YOUTUBE_CLIENT_ID', 'OAUTH_CLIENT_ID'],
    clientSecretEnv: ['GOOGLE_CLIENT_SECRET', 'YOUTUBE_CLIENT_SECRET', 'OAUTH_CLIENT_SECRET'],
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/youtube.readonly'],
    authorizeExtras: { access_type: 'offline', prompt: 'consent' },
  },
  linkedin: {
    id: 'linkedin',
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientIdEnv: ['LINKEDIN_CLIENT_ID', 'OAUTH_CLIENT_ID'],
    clientSecretEnv: ['LINKEDIN_CLIENT_SECRET', 'OAUTH_CLIENT_SECRET'],
    scopes: ['openid', 'profile', 'email'],
  },
  instagram: {
    id: 'instagram',
    // Meta Instagram Basic Display / Graph — use Facebook Login for Business in production
    authorizeUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    clientIdEnv: ['INSTAGRAM_CLIENT_ID', 'FACEBOOK_APP_ID', 'OAUTH_CLIENT_ID'],
    clientSecretEnv: ['INSTAGRAM_CLIENT_SECRET', 'FACEBOOK_APP_SECRET', 'OAUTH_CLIENT_SECRET'],
    scopes: ['user_profile', 'user_media'],
  },
  twitter: {
    id: 'twitter',
    authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    clientIdEnv: ['TWITTER_CLIENT_ID', 'OAUTH_CLIENT_ID'],
    clientSecretEnv: ['TWITTER_CLIENT_SECRET', 'OAUTH_CLIENT_SECRET'],
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    // PKCE S256 is applied in buildAuthorizeUrl — do not set plain challenge here
  },
  tiktok: {
    id: 'tiktok',
    authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientIdEnv: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_ID', 'OAUTH_CLIENT_ID'],
    clientSecretEnv: ['TIKTOK_CLIENT_SECRET', 'OAUTH_CLIENT_SECRET'],
    scopes: ['user.info.basic'],
  },
};

export function resolveEnv(names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function getProviderConfig(provider: string): ProviderOAuthConfig | null {
  return OAUTH_PROVIDERS[provider] ?? null;
}
