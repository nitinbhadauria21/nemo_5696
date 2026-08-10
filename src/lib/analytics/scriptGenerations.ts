import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeProperties } from '@/lib/analytics/track';

export type ScriptGenerationInput = {
  userId: string | null;
  mode?: string | null;
  topic?: string | null;
  audienceType?: string | null;
  customAudience?: string | null;
  duration?: string | null;
  scenesCount?: number | null;
  language?: string | null;
  frameworkLabel?: string | null;
  viralScore?: number | null;
  success: boolean;
  parseOk?: boolean;
  latencyMs?: number | null;
  provider?: string | null;
  model?: string | null;
  savedScriptId?: string | null;
  copied?: boolean;
  preview?: string | null;
  properties?: Record<string, unknown> | null;
};

function truncatePreview(text?: string | null): string | null {
  if (!text) return null;
  return text.length > 500 ? text.slice(0, 500) : text;
}

/** Insert a script_generations row (best-effort, never throws). */
export async function insertScriptGeneration(
  input: ScriptGenerationInput
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    if (!admin || !input.userId) return null;

    const { data, error } = await admin
      .from('script_generations')
      .insert({
        user_id: input.userId,
        mode: input.mode ?? null,
        topic: input.topic ?? null,
        audience_type: input.audienceType ?? null,
        custom_audience: input.customAudience ?? null,
        duration: input.duration ?? null,
        scenes_count: input.scenesCount ?? null,
        language: input.language ?? null,
        framework_label: input.frameworkLabel ?? null,
        viral_score: input.viralScore ?? null,
        success: input.success,
        parse_ok: input.parseOk ?? false,
        latency_ms: input.latencyMs ?? null,
        provider: input.provider ?? null,
        model: input.model ?? null,
        saved_script_id: input.savedScriptId ?? null,
        copied: input.copied ?? false,
        preview: truncatePreview(input.preview),
        properties: sanitizeProperties(input.properties),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[analytics] insertScriptGeneration failed', error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error('[analytics] insertScriptGeneration error', err);
    return null;
  }
}

/** Patch generation row on copy/save (best-effort). */
export async function updateScriptGeneration(
  id: string,
  userId: string,
  patch: {
    copied?: boolean;
    savedScriptId?: string | null;
    properties?: Record<string, unknown> | null;
  }
): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin || !id) return;

    const updates: Record<string, unknown> = {};
    if (typeof patch.copied === 'boolean') updates.copied = patch.copied;
    if (patch.savedScriptId !== undefined) updates.saved_script_id = patch.savedScriptId;
    if (patch.properties) updates.properties = sanitizeProperties(patch.properties);

    if (Object.keys(updates).length === 0) return;

    const { error } = await admin
      .from('script_generations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) console.error('[analytics] updateScriptGeneration failed', error.message);
  } catch (err) {
    console.error('[analytics] updateScriptGeneration error', err);
  }
}
