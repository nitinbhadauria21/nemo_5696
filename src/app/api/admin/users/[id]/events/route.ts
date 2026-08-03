import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdminSession } from '@/lib/admin/auth';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ events: [], profile: null, source: 'mock' });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 });
  }

  const [{ data: profile }, { data: events }] = await Promise.all([
    admin
      .from('profiles')
      .select(
        'id, email, full_name, plan, niches, platforms, onboarding_complete, connected_socials, schedule, created_at, updated_at'
      )
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('user_events')
      .select('id, event_name, event_category, page_path, properties, created_at, session_id')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    profile,
    events: events ?? [],
    source: 'supabase',
  });
}
