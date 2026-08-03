import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { trackEvent } from '@/lib/analytics/track';
import { resolveUserId } from '@/lib/api/requireUser';

const memoryQueue = new Map<string, Array<Record<string, unknown>>>();

export async function GET() {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (isSupabaseConfigured() && !demo) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ items: [] });
    const { data } = await supabase
      .from('queue_items')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order');
    return NextResponse.json({ items: data ?? [] });
  }
  return NextResponse.json({ items: memoryQueue.get(userId) ?? [] });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  const body = await request.json();
  const item = {
    id: crypto.randomUUID(),
    title: body.title,
    status: body.status || 'ideas',
    platform: body.platform || null,
    notes: body.notes || '',
    sort_order: body.sort_order ?? 0,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && !demo) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    const { data, error } = await supabase
      .from('queue_items')
      .insert({ ...item, user_id: userId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await trackEvent({
      userId,
      eventName: 'queue.create',
      eventCategory: 'queue',
      properties: { status: item.status, platform: item.platform },
      request,
    });
    return NextResponse.json({ item: data });
  }

  const list = memoryQueue.get(userId) ?? [];
  list.push(item);
  memoryQueue.set(userId, list);
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (isSupabaseConfigured() && !demo) {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    const { data, error } = await supabase
      .from('queue_items')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await trackEvent({
      userId,
      eventName: 'queue.update',
      eventCategory: 'queue',
      properties: { id: body.id, status: body.status },
      request,
    });
    return NextResponse.json({ item: data });
  }

  const list = memoryQueue.get(userId) ?? [];
  const idx = list.findIndex((i) => i.id === body.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...body };
  return NextResponse.json({ item: list[idx] });
}

export async function DELETE(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  const body = await request.json().catch(() => ({}));
  const id = body.id as string | undefined;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (isSupabaseConfigured() && !demo) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.from('queue_items').delete().eq('id', id).eq('user_id', userId);
      await trackEvent({
        userId,
        eventName: 'queue.delete',
        eventCategory: 'queue',
        properties: { id },
        request,
      });
    }
  } else {
    const list = memoryQueue.get(userId) ?? [];
    memoryQueue.set(
      userId,
      list.filter((i) => i.id !== id)
    );
  }

  return NextResponse.json({ ok: true });
}
