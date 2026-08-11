import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await supabase.from('saved_trends').delete().eq('user_id', data.user.id).eq('trend_id', id);
  return NextResponse.json({ ok: true });
}
