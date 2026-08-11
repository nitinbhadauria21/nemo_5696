import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';
import { exchangeAuthorizationCode } from '@/lib/oauth/exchange';
import { canSealConnectionTokens, sealTokens } from '@/lib/crypto/sealTokens';

async function appendConnectedSocial(userId: string, provider: string) {
  const supabase = await createClient();
  if (!supabase) return;

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

function parseState(raw: string | null): { returnTo: string; uid?: string } {
  if (!raw) return { returnTo: '/settings' };
  if (raw.startsWith('return:')) return { returnTo: raw.slice(7) };
  try {
    const json = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      returnTo?: string;
      uid?: string;
    };
    return {
      returnTo: json.returnTo || '/settings',
      uid: json.uid,
    };
  } catch {
    return { returnTo: '/settings' };
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const code = request.nextUrl.searchParams.get('code');
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028').replace(/\/$/, '');
  const stateRaw = request.nextUrl.searchParams.get('state');
  const { returnTo: parsedReturn, uid: stateUid } = parseState(stateRaw);
  const returnTo = parsedReturn.includes('oauth=')
    ? parsedReturn
    : `${parsedReturn}${parsedReturn.includes('?') ? '&' : '?'}oauth=${provider}`;

  const fail = (reason: string) =>
    NextResponse.redirect(
      `${siteUrl}${returnTo.split('?')[0]}?oauth=error&reason=${encodeURIComponent(reason)}&provider=${provider}`
    );

  if (!code) return fail('missing_code');

  const userId = (await getAuthUserId()) || stateUid;
  if (!userId) return fail('not_signed_in');

  if (!canSealConnectionTokens()) {
    return fail('encryption_key_missing');
  }

  const redirectUri = `${siteUrl}/api/auth/oauth/${provider}/callback`;
  const codeVerifier = request.cookies.get(`oauth_pkce_${provider}`)?.value;

  const exchanged = await exchangeAuthorizationCode({
    provider,
    code,
    redirectUri,
    codeVerifier,
  });

  if (!exchanged.ok) {
    console.error('[oauth] token exchange failed', provider, exchanged.error);
    await trackEvent({
      userId,
      eventName: 'connection.oauth_failed',
      eventCategory: 'connection',
      properties: { platform: provider, error: exchanged.error },
      request,
    });
    return fail(exchanged.error);
  }

  let sealed: string;
  try {
    sealed = sealTokens(exchanged.tokens);
  } catch (err) {
    console.error('[oauth] seal failed', err);
    return fail('seal_failed');
  }

  if (isSupabaseConfigured()) {
    // Prefer service role so encrypted_tokens can be written even if column is new
    const admin = createAdminClient();
    const supabase = admin || (await createClient());
    if (supabase) {
      const row = {
        user_id: userId,
        platform: provider,
        connected_at: new Date().toISOString(),
        encrypted_tokens: sealed,
        token_expires_at: exchanged.expiresAt,
        scopes: exchanged.scopes,
        status: 'active',
        metadata: {
          connected: true,
          connected_at: new Date().toISOString(),
          token_status: 'active',
          has_refresh: Boolean(exchanged.tokens.refresh_token),
          // Never put access_token here
        },
      };

      const { error } = await supabase.from('user_connections').upsert(row, {
        onConflict: 'user_id,platform',
      });

      if (error) {
        console.error('[oauth] upsert failed', error.message);
        // Fallback without new columns if migration not applied yet
        const { error: err2 } = await supabase.from('user_connections').upsert(
          {
            user_id: userId,
            platform: provider,
            metadata: {
              connected: true,
              connected_at: new Date().toISOString(),
              token_status: 'active',
              has_refresh: Boolean(exchanged.tokens.refresh_token),
              sealed_legacy: sealed,
            },
          },
          { onConflict: 'user_id,platform' }
        );
        if (err2) {
          console.error('[oauth] fallback upsert failed', err2.message);
          return fail('db_write_failed');
        }
      }

      await appendConnectedSocial(userId, provider);
    }
  }

  await trackEvent({
    userId,
    eventName: 'connection.connected',
    eventCategory: 'connection',
    properties: { platform: provider, via: 'oauth_token_exchange' },
    request,
  });

  const successUrl = `${siteUrl}${returnTo.split('?')[0]}?oauth=${provider}&connected=1`;
  const res = NextResponse.redirect(successUrl);
  res.cookies.set(`oauth_pkce_${provider}`, '', { path: '/', maxAge: 0 });
  return res;
}
