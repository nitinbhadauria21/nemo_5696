import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { getProviderConfig } from '@/lib/oauth/providers';
import { buildAuthorizeUrl } from '@/lib/oauth/exchange';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028').replace(/\/$/, '');
  const redirectUri = `${siteUrl}/api/auth/oauth/${provider}/callback`;
  const returnTo = request.nextUrl.searchParams.get('returnTo') || `/settings?oauth=${provider}`;

  if (!getProviderConfig(provider)) {
    const dest = `${returnTo.includes('?') ? `${returnTo}&` : `${returnTo}?`}oauth=error&reason=unsupported_provider`;
    return NextResponse.redirect(new URL(dest, siteUrl).toString());
  }

  const userId = await getAuthUserId();
  if (!userId) {
    const login = `/login?next=${encodeURIComponent(`/api/auth/oauth/${provider}`)}`;
    return NextResponse.redirect(new URL(login, siteUrl).toString());
  }

  const statePayload = Buffer.from(
    JSON.stringify({ returnTo, uid: userId, t: Date.now() }),
    'utf8'
  ).toString('base64url');

  const built = buildAuthorizeUrl({
    provider,
    redirectUri,
    state: statePayload,
  });

  if ('error' in built) {
    const dest = `${returnTo.includes('?') ? `${returnTo}&` : `${returnTo}?`}oauth=error&reason=${built.error}&provider=${provider}`;
    return NextResponse.redirect(new URL(dest, siteUrl).toString());
  }

  const res = NextResponse.redirect(built.url);
  if (built.codeVerifier) {
    res.cookies.set(`oauth_pkce_${provider}`, built.codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });
  }
  return res;
}
