import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveUserId } from '@/lib/api/requireUser';
import { trackEvent } from '@/lib/analytics/track';
import { insertScriptGeneration, updateScriptGeneration } from '@/lib/analytics/scriptGenerations';

/** POST — log a Viral Script Writer generation attempt */
export async function POST(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (demo) {
    return NextResponse.json({ ok: true, id: null, source: 'demo' });
  }

  const body = await request.json().catch(() => ({}));
  const success = Boolean(body.success);
  const preview =
    typeof body.preview === 'string'
      ? body.preview.slice(0, 500)
      : typeof body.rawMarkdown === 'string'
        ? body.rawMarkdown.slice(0, 500)
        : null;

  const mode = typeof body.mode === 'string' ? body.mode : null;
  const incomingProps =
    body.properties && typeof body.properties === 'object' && !Array.isArray(body.properties)
      ? (body.properties as Record<string, unknown>)
      : {};
  const refineTopic =
    typeof body.refineTopic === 'string'
      ? body.refineTopic
      : typeof body.refine_topic === 'string'
        ? body.refine_topic
        : typeof incomingProps.refineTopic === 'string'
          ? incomingProps.refineTopic
          : typeof incomingProps.refine_topic === 'string'
            ? incomingProps.refine_topic
            : null;
  const refineDraftPreview =
    typeof body.refineDraftPreview === 'string'
      ? body.refineDraftPreview.slice(0, 200)
      : typeof incomingProps.refineDraftPreview === 'string'
        ? String(incomingProps.refineDraftPreview).slice(0, 200)
        : null;

  const id = await insertScriptGeneration({
    userId,
    mode,
    topic: body.topic ?? null,
    audienceType: body.audienceType ?? body.audience_type ?? null,
    customAudience: body.customAudience ?? body.custom_audience ?? null,
    duration: body.duration ?? null,
    scenesCount:
      typeof body.scenesCount === 'number'
        ? body.scenesCount
        : typeof body.scenes_count === 'number'
          ? body.scenes_count
          : null,
    language: body.language ?? null,
    frameworkLabel: body.frameworkLabel ?? body.framework_label ?? null,
    viralScore:
      typeof body.viralScore === 'number'
        ? body.viralScore
        : typeof body.viral_score === 'number'
          ? body.viral_score
          : null,
    success,
    parseOk: body.parseOk ?? body.parse_ok ?? success,
    latencyMs: typeof body.latencyMs === 'number' ? body.latencyMs : null,
    provider: body.provider ?? null,
    model: body.model ?? null,
    preview,
    properties: {
      ...incomingProps,
      ...(mode === 'refine'
        ? {
            refineTopic: refineTopic || body.topic || 'Refined Draft',
            draftLabel: 'Refined Draft',
            ...(refineDraftPreview ? { refineDraftPreview } : {}),
          }
        : { createTopic: typeof body.topic === 'string' ? body.topic : incomingProps.createTopic }),
    },
  });

  await trackEvent({
    userId,
    eventName: success ? 'script.generate_success' : 'script.generate_fail',
    eventCategory: 'script',
    properties: {
      generation_id: id,
      mode: body.mode,
      topic: typeof body.topic === 'string' ? body.topic.slice(0, 200) : null,
      audience_type: body.audienceType ?? body.audience_type,
      duration: body.duration,
      language: body.language,
      scenes_count: body.scenesCount ?? body.scenes_count,
      viral_score: body.viralScore ?? body.viral_score,
    },
    request,
  });

  return NextResponse.json({ ok: true, id });
}

/** PATCH — mark copied / link saved_script_id */
export async function PATCH(request: NextRequest) {
  const resolved = await resolveUserId();
  if ('error' in resolved) return resolved.error;
  const { userId, demo } = resolved;

  if (demo) return NextResponse.json({ ok: true, source: 'demo' });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await updateScriptGeneration(id, userId, {
    copied: typeof body.copied === 'boolean' ? body.copied : undefined,
    savedScriptId: body.savedScriptId ?? body.saved_script_id,
    properties: body.properties ?? undefined,
  });

  if (body.copied === true) {
    await trackEvent({
      userId,
      eventName: 'script.copy',
      eventCategory: 'script',
      properties: { generation_id: id },
      request,
    });
  }

  // Also allow client-side updates via user JWT for RLS path
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase && body.savedScriptId) {
      await supabase
        .from('script_generations')
        .update({ saved_script_id: body.savedScriptId })
        .eq('id', id)
        .eq('user_id', userId);
    }
  }

  return NextResponse.json({ ok: true });
}
