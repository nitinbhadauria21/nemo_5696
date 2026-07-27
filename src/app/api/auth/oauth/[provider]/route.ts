import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

const OAUTH_BASE: Record<string, string> = {
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
  linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
  instagram: 'https://api.instagram.com/oauth/authorize',
  youtube: 'https://accounts.google.com/o/oauth2/v2/auth',
  tiktok: 'https://www.tiktok.com/v2/auth/authorize',
  twitter: 'https://twitter.com/i/oauth2/authorize',
};

async function markConnected(userId: string, provider: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  if (!supabase) return;

  await supabase.from('user_connections').upsert({
    user_id: userId,
    platform: provider,
    metadata: {
      connected: true,
      connected_at: new Date().toISOString(),
      token_status: 'dev_stub',
    },
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('connected_socials')
    .eq('id', userId)
    .maybeSingle();

  const existing = (profile?.connected_socials as string[] | null) ?? [];
  if (!existing.includes(provider)) {
    await supabase
      .from('profiles')
      .update({
        connected_socials: [...existing, provider],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`] || process.env.OAUTH_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';
  const redirectUri = `${siteUrl}/api/auth/oauth/${provider}/callback`;
  const returnTo =
    request.nextUrl.searchParams.get('returnTo') ||
    `/settings?oauth=${provider}&connected=1`;

  // MVP fallback: when OAuth client IDs are missing, mark connection server-side and redirect back
  if (!clientId || !OAUTH_BASE[provider]) {
    const userId = await getAuthUserId();
    if (userId) {
      await markConnected(userId, provider);
      await trackEvent({
        userId,
        eventName: 'connection.connected',
        eventCategory: 'connection',
        properties: { platform: provider, via: 'dev_stub' },
        request,
      });
    }
    const dest = returnTo.includes('?')
      ? `${returnTo}&oauth=${provider}&connected=1`
      : `${returnTo}?oauth=${provider}&connected=1`;
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
