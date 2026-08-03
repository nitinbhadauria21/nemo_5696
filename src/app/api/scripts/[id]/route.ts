import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveUserId } from '@/lib/api/requireUser';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;
  if (demo || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title || body.topic) updates.title = body.title || body.topic;
  if (body.platform !== undefined) updates.platform = body.platform;
  if (body.trendId !== undefined || body.trend_id !== undefined) {
    updates.trend_id = body.trendId ?? body.trend_id;
  }
  if (body.content !== undefined) updates.content = body.content;

  const { error } = await supabase
    .from('saved_scripts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;
  if (demo || !isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const { error } = await supabase
    .from('saved_scripts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
