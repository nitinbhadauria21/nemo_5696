import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const code = request.nextUrl.searchParams.get('code');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';

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
        metadata: { connected: true, connected_at: new Date().toISOString() },
      });
    }
  }

  return NextResponse.redirect(`${siteUrl}/settings?oauth=${provider}&connected=1`);
}
