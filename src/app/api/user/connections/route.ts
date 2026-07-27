import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { platform } = await request.json();
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ ok: true, platform, oauthUrl: `/api/auth/oauth/${platform}` });
    await supabase.from('user_connections').upsert({ user_id: userId, platform, metadata: { connected: true } });
  }

  return NextResponse.json({ ok: true, platform, oauthUrl: `/api/auth/oauth/${platform}` });
}
