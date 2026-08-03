import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type AiGenerationLog = {
  userId: string | null;
  generationType: string;
  model?: string | null;
  trendId?: string | null;
  success: boolean;
  tokensEstimate?: number | null;
  error?: string | null;
  properties?: Record<string, unknown>;
};

/** Best-effort insert into ai_generations (never throws). */
export async function logAiGeneration(entry: AiGenerationLog): Promise<void> {
  if (!isSupabaseConfigured() || !entry.userId) return;
  try {
    const supabase = await createClient();
    if (!supabase) return;
    await supabase.from('ai_generations').insert({
      user_id: entry.userId,
      generation_type: entry.generationType,
      model: entry.model ?? null,
      trend_id: entry.trendId ?? null,
      success: entry.success,
      tokens_estimate: entry.tokensEstimate ?? null,
      error: entry.error ?? null,
      properties: entry.properties ?? {},
    });
  } catch {
    // non-blocking
  }
}
