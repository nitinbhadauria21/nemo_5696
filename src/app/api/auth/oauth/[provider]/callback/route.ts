import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const code = request.nextUrl.searchParams.get('code');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';
  const returnTo = request.nextUrl.searchParams.get('state')?.startsWith('return:')
    ? request.nextUrl.searchParams.get('state')!.slice(7)
    : '/settings?oauth=' + provider + '&connected=1';

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/settings?oauth=error`);
  }

  const userId = await getAuthUserId();
  if (isSupabaseConfigured() && userId) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.from('user_connections').upsert({
        user_id: userId,
        platform: provider,
        metadata: { connected: true, connected_at: new Date().toISOString(), token_status: 'active' },
      });
      await appendConnectedSocial(userId, provider);
    }
    await trackEvent({
      userId,
      eventName: 'connection.connected',
      eventCategory: 'connection',
      properties: { platform: provider, via: 'oauth_callback' },
      request,
    });
  }

  return NextResponse.redirect(`${siteUrl}${returnTo}`);
}
