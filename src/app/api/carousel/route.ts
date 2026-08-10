import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveUserId } from '@/lib/api/requireUser';
import { trackEvent } from '@/lib/analytics/track';

/** Create a carousel project (metadata only — no PNG blobs). */
export async function POST(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (demo) {
    return NextResponse.json({ ok: true, id: `demo-${Date.now()}`, source: 'demo' });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const slidesMeta = Array.isArray(body.slidesMeta)
    ? body.slidesMeta
    : Array.isArray(body.slides_meta)
      ? body.slides_meta
      : [];

  const { data, error } = await supabase
    .from('carousel_projects')
    .insert({
      user_id: userId,
      topic: body.topic ?? null,
      source: body.source ?? 'manual',
      format: body.format ?? null,
      slide_count:
        typeof body.slideCount === 'number'
          ? body.slideCount
          : typeof body.slide_count === 'number'
            ? body.slide_count
            : slidesMeta.length,
      accent_color: body.accentColor ?? body.accent_color ?? null,
      template: body.template ?? null,
      slides_meta: slidesMeta,
      exported: Boolean(body.exported),
      export_count: typeof body.exportCount === 'number' ? body.exportCount : 0,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await trackEvent({
    userId,
    eventName: 'carousel.create',
    eventCategory: 'carousel',
    properties: {
      carousel_id: data.id,
      topic: typeof body.topic === 'string' ? body.topic.slice(0, 200) : null,
      slide_count: body.slideCount ?? body.slide_count ?? slidesMeta.length,
      format: body.format,
    },
    request,
  });

  return NextResponse.json({ ok: true, id: data.id });
}

/** Update / mark exported. */
export async function PATCH(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (demo) return NextResponse.json({ ok: true, source: 'demo' });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.topic !== undefined) updates.topic = body.topic;
  if (body.format !== undefined) updates.format = body.format;
  if (body.accentColor !== undefined || body.accent_color !== undefined) {
    updates.accent_color = body.accentColor ?? body.accent_color;
  }
  if (body.slidesMeta !== undefined || body.slides_meta !== undefined) {
    updates.slides_meta = body.slidesMeta ?? body.slides_meta;
  }
  if (body.slideCount !== undefined || body.slide_count !== undefined) {
    updates.slide_count = body.slideCount ?? body.slide_count;
  }
  if (body.exported === true) {
    updates.exported = true;
    // bump export_count via read-modify
    const { data: existing } = await supabase
      .from('carousel_projects')
      .select('export_count')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    updates.export_count = (existing?.export_count ?? 0) + 1;
  }

  const { error } = await supabase
    .from('carousel_projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.exported === true) {
    await trackEvent({
      userId,
      eventName: 'carousel.export',
      eventCategory: 'carousel',
      properties: { carousel_id: id },
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
