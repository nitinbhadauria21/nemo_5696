import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveUserId } from '@/lib/api/requireUser';
import { trackEvent } from '@/lib/analytics/track';

export async function GET() {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (!isSupabaseConfigured() || demo) {
    return NextResponse.json({ scripts: [], source: demo ? 'demo' : 'offline' });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ scripts: [] });

  const { data, error } = await supabase
    .from('saved_scripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const scripts = (data ?? []).map((row) => {
    const content = (row.content ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      topic: row.title,
      platform: row.platform ?? 'Unknown',
      niche: (content.niche as string) || 'General',
      versions: (content.versions as unknown[]) ?? [
        {
          id: 'v1',
          style: 'default',
          styleLabel: 'Saved',
          hook: (content.hook as string) || '',
          body: (content.body as string) || (content.rawMarkdown as string) || '',
          cta: (content.cta as string) || '',
          viralScore: (content.viralScore as number) || 0,
          timestamps: (content.timestamps as string[]) || [],
          deliveryNotes: (content.deliveryNotes as string) || '',
        },
      ],
      generatedAt: row.created_at,
      trendId: row.trend_id,
      content,
    };
  });

  return NextResponse.json({ scripts, source: 'supabase' });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (demo) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const body = await request.json();
  const title = (body.title || body.topic || '').trim();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const content = body.content ?? {
    hook: body.hook,
    body: body.body || body.rawMarkdown,
    cta: body.cta,
    viralScore: body.viralScore,
    timestamps: body.timestamps,
    deliveryNotes: body.deliveryNotes,
    frameworkLabel: body.frameworkLabel,
    rawMarkdown: body.rawMarkdown,
    niche: body.niche,
    versions: body.versions,
  };

  const { data, error } = await supabase
    .from('saved_scripts')
    .insert({
      user_id: userId,
      title,
      platform: body.platform ?? null,
      trend_id: body.trendId ?? body.trend_id ?? null,
      content,
      audience_type:
        body.audienceType ?? body.audience_type ?? content.audienceType ?? null,
      duration: body.duration ?? content.duration ?? null,
      language: body.language ?? content.language ?? null,
      framework:
        body.framework ?? content.frameworkLabel ?? content.framework ?? null,
      viral_score:
        typeof body.viralScore === 'number'
          ? body.viralScore
          : typeof content.viralScore === 'number'
            ? content.viralScore
            : null,
      mode: body.mode ?? content.mode ?? null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const generationId =
    typeof body.generationId === 'string'
      ? body.generationId
      : typeof body.generation_id === 'string'
        ? body.generation_id
        : null;
  if (generationId) {
    await supabase
      .from('script_generations')
      .update({ saved_script_id: data.id })
      .eq('id', generationId)
      .eq('user_id', userId);
  }

  await trackEvent({
    userId,
    eventName: 'script.save',
    eventCategory: 'script',
    properties: {
      script_id: data.id,
      platform: body.platform ?? null,
      generation_id: generationId,
      audience_type: body.audienceType ?? content.audienceType ?? null,
      duration: body.duration ?? content.duration ?? null,
      language: body.language ?? content.language ?? null,
      mode: body.mode ?? content.mode ?? null,
    },
    request,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
