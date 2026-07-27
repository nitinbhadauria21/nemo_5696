import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ profile: null, source: 'unauthenticated' });
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({
        profile: { id: userId, plan: 'free', niches: [], platforms: [] },
        source: 'fallback',
      });
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return NextResponse.json({ profile: data, source: 'supabase' });
  }

  try {
    const raw = typeof window !== 'undefined' ? null : null;
    void raw;
  } catch { /* server only */ }

  return NextResponse.json({
    profile: { id: userId, plan: 'free', niches: [], platforms: [] },
    source: 'fallback',
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.full_name !== undefined) updates.full_name = body.full_name;
  if (body.niches !== undefined) updates.niches = body.niches;
  if (body.platforms !== undefined) updates.platforms = body.platforms;
  if (body.schedule !== undefined) updates.schedule = body.schedule;
  if (body.onboarding_complete !== undefined) updates.onboarding_complete = body.onboarding_complete;
  if (body.connected_socials !== undefined) updates.connected_socials = body.connected_socials;
  updates.updated_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ profile: { id: userId, ...updates }, source: 'local' });
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  }

  return NextResponse.json({ profile: { id: userId, ...updates }, source: 'local' });
}
