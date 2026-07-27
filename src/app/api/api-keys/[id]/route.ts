import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ ok: true });
    await supabase.from('api_keys').delete().eq('id', id).eq('user_id', userId);
  }
  return NextResponse.json({ ok: true });
}
