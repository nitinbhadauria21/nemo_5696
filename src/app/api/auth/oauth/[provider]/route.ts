import { NextRequest, NextResponse } from 'next/server';

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
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028'}/api/auth/oauth/${provider}/callback`;

  if (!clientId || !OAUTH_BASE[provider]) {
    return NextResponse.json(
      { error: `OAuth not configured for ${provider}. Set ${provider.toUpperCase()}_CLIENT_ID.` },
      { status: 501 }
    );
  }

  const url = new URL(OAUTH_BASE[provider]);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', provider);

  return NextResponse.redirect(url.toString());
}
