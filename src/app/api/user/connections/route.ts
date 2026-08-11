import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';
import { sanitizeConnectionMetadata } from '@/lib/connections/sanitizeMetadata';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from('user_connections')
        .select('platform, metadata, connected_at, status, token_expires_at, scopes')
        .eq('user_id', userId);
      const connections = (data ?? []).map((row) => ({
        platform: row.platform,
        connected_at: row.connected_at,
        status: row.status ?? 'active',
        token_expires_at: row.token_expires_at ?? null,
        scopes: row.scopes ?? [],
        metadata: sanitizeConnectionMetadata((row.metadata ?? {}) as Record<string, unknown>),
      }));
      return NextResponse.json({ connections });
    }
  }

  return NextResponse.json({ connections: [] });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { platform } = await request.json();
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

  await trackEvent({
    userId,
    eventName: 'connection.connect_start',
    eventCategory: 'connection',
    properties: { platform },
    request,
  });

  return NextResponse.json({ ok: true, platform, oauthUrl: `/api/auth/oauth/${platform}` });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { platform } = await request.json();
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      // Soft-revoke: clear vault, keep audit row
      await supabase
        .from('user_connections')
        .update({
          status: 'revoked',
          encrypted_tokens: null,
          token_expires_at: null,
          scopes: [],
          metadata: {
            connected: false,
            token_status: 'revoked',
            disconnected_at: new Date().toISOString(),
          },
        })
        .eq('user_id', userId)
        .eq('platform', platform);

      const { data: profile } = await supabase
        .from('profiles')
        .select('connected_socials')
        .eq('id', userId)
        .maybeSingle();

      const socials = (profile?.connected_socials as string[] | null) ?? [];
      await supabase
        .from('profiles')
        .update({
          connected_socials: socials.filter((s) => s !== platform),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  }

  await trackEvent({
    userId,
    eventName: 'connection.disconnect',
    eventCategory: 'connection',
    properties: { platform },
    request,
  });

  return NextResponse.json({ ok: true });
}
