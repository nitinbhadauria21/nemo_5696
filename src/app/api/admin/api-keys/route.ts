import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET() {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ keys: [], source: 'mock' });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data: keys, error } = await admin
    .from('api_keys')
    .select('id, user_id, name, key_prefix, created_at, last_used_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((keys ?? []).map((k) => k.user_id))];
  const emailById: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      emailById[p.id] = p.email ?? p.full_name;
    }
  }

  return NextResponse.json({
    keys: (keys ?? []).map((k) => ({
      ...k,
      user_label: emailById[k.user_id] ?? k.user_id,
    })),
    source: 'supabase',
  });
}
