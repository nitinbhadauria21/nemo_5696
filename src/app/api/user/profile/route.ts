import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

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
  } catch {
    /* server only */
  }

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
  if (body.onboarding_complete !== undefined)
    updates.onboarding_complete = body.onboarding_complete;
  if (body.connected_socials !== undefined) updates.connected_socials = body.connected_socials;
  updates.updated_at = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase)
      return NextResponse.json({ profile: { id: userId, ...updates }, source: 'local' });

    // Prefer update; if no row (missing trigger), upsert via service role
    let { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      const admin = createAdminClient();
      const { data: authUser } = await supabase.auth.getUser();
      const upsertPayload = {
        id: userId,
        email: authUser.user?.email ?? null,
        full_name: authUser.user?.user_metadata?.full_name ?? null,
        ...updates,
      };
      if (admin) {
        const upserted = await admin
          .from('profiles')
          .upsert(upsertPayload, { onConflict: 'id' })
          .select()
          .single();
        data = upserted.data;
        error = upserted.error;
      } else {
        const upserted = await supabase
          .from('profiles')
          .upsert(upsertPayload, { onConflict: 'id' })
          .select()
          .single();
        data = upserted.data;
        error = upserted.error;
      }
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await trackEvent({
      userId,
      eventName: body.onboarding_complete ? 'profile.onboarding_complete' : 'profile.update',
      eventCategory: 'profile',
      properties: {
        fields: Object.keys(updates).filter((k) => k !== 'updated_at'),
        onboarding_complete: body.onboarding_complete ?? undefined,
      },
      request,
    });

    return NextResponse.json({ profile: data });
  }

  return NextResponse.json({ profile: { id: userId, ...updates }, source: 'local' });
}
