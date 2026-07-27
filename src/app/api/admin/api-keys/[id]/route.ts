import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: Ctx) {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, source: 'mock' });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { error } = await admin.from('api_keys').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, source: 'supabase' });
}
