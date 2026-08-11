import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) {
    return NextResponse.json({ saved: [] });
  }
  const { data } = await supabase
    .from('saved_trends')
    .select('trend_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return NextResponse.json({ saved: data || [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const trendId = String(body.trendId || '');
  if (!trendId) return NextResponse.json({ error: 'trendId required' }, { status: 400 });
  await supabase.from('saved_trends').upsert({ user_id: user.id, trend_id: trendId });
  return NextResponse.json({ ok: true });
}
