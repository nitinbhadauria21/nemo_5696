import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { sanitizeProperties } from '@/lib/analytics/track';

export type AiGenerationLog = {
  userId: string | null;
  generationType: string;
  model?: string | null;
  trendId?: string | null;
  success: boolean;
  tokensEstimate?: number | null;
  error?: string | null;
  properties?: Record<string, unknown>;
  /** Enriched ops fields (Phase 2) */
  latencyMs?: number | null;
  ttftMs?: number | null;
  costUsdEst?: number | null;
  task?: string | null;
  status?: string | null;
  modelUsed?: string | null;
  attemptCount?: number | null;
};

/** Rough OpenRouter-ish cost estimate from token count (USD). */
export function estimateCostUsd(tokens?: number | null, model?: string | null): number | null {
  if (!tokens || tokens <= 0) return null;
  const m = (model || '').toLowerCase();
  // Very rough blended rates per 1M tokens
  let perMillion = 1.5;
  if (m.includes('gpt-4o-mini') || m.includes('flash') || m.includes('haiku')) perMillion = 0.3;
  else if (m.includes('gpt-4o') || m.includes('sonnet')) perMillion = 5;
  else if (m.includes('opus') || m.includes('gpt-4')) perMillion = 15;
  return Math.round((tokens / 1_000_000) * perMillion * 1_000_000) / 1_000_000;
}

/** Best-effort insert into ai_generations (never throws). */
export async function logAiGeneration(entry: AiGenerationLog): Promise<void> {
  if (!isSupabaseConfigured() || !entry.userId) return;
  try {
    const modelUsed = entry.modelUsed ?? entry.model ?? null;
    const status = entry.status ?? (entry.success ? 'ok' : 'error');
    const cost = entry.costUsdEst ?? estimateCostUsd(entry.tokensEstimate, modelUsed);

    const row = {
      user_id: entry.userId,
      generation_type: entry.generationType,
      model: entry.model ?? null,
      trend_id: entry.trendId ?? null,
      success: entry.success,
      tokens_estimate: entry.tokensEstimate ?? null,
      error: entry.error ?? null,
      properties: sanitizeProperties(entry.properties ?? {}),
      latency_ms: entry.latencyMs ?? null,
      ttft_ms: entry.ttftMs ?? null,
      cost_usd_est: cost,
      task: entry.task ?? entry.generationType,
      status,
      model_used: modelUsed,
      attempt_count: entry.attemptCount ?? 1,
    };

    // Prefer user JWT insert; fall back to service role for reliability
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.from('ai_generations').insert(row);
      if (!error) return;
    }

    const admin = createAdminClient();
    if (admin) {
      await admin.from('ai_generations').insert(row);
    }
  } catch {
    // non-blocking
  }
}
