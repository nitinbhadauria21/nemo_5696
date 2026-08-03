import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';

const OAUTH_BASE: Record<string, string> = {
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
  linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
  instagram: 'https://api.instagram.com/oauth/authorize',
  youtube: 'https://accounts.google.com/o/oauth2/v2/auth',
  tiktok: 'https://www.tiktok.com/v2/auth/authorize',
  twitter: 'https://twitter.com/i/oauth2/authorize',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`] || process.env.OAUTH_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';
  const redirectUri = `${siteUrl}/api/auth/oauth/${provider}/callback`;
  const returnTo =
    request.nextUrl.searchParams.get('returnTo') || `/settings?oauth=${provider}`;

  if (!OAUTH_BASE[provider]) {
    const dest = `${returnTo.includes('?') ? returnTo + '&' : returnTo + '?'}oauth=error&reason=unsupported_provider`;
    return NextResponse.redirect(new URL(dest, siteUrl).toString());
  }

  if (!clientId) {
    // Do not fake-connect — require real OAuth credentials
    const userId = await getAuthUserId();
    void userId;
    const dest = `${returnTo.includes('?') ? returnTo + '&' : returnTo + '?'}oauth=error&reason=not_configured&provider=${provider}`;
    return NextResponse.redirect(new URL(dest, siteUrl).toString());
  }

  const state = `return:${returnTo}`;
  const url = new URL(OAUTH_BASE[provider]);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);

  return NextResponse.redirect(url.toString());
}
