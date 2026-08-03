import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isProductionRuntime } from '@/lib/billing/catalogue';

export type PlanId = 'free' | 'pro' | 'agency';

export const PLAN_AI_LIMITS: Record<PlanId, number> = {
  free: 5,
  pro: 100,
  agency: 10_000,
};

export const PLAN_FEATURES = {
  free: { reportsPdf: false, viralScripts: true, analyticsAdvanced: false },
  pro: { reportsPdf: true, viralScripts: true, analyticsAdvanced: true },
  agency: { reportsPdf: true, viralScripts: true, analyticsAdvanced: true },
} as const;

export function currentPeriodKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function normalizePlan(plan: unknown): PlanId {
  if (plan === 'pro' || plan === 'agency' || plan === 'free') return plan;
  return 'free';
}

/**
 * Plan authority: authenticated profile only in production / when Supabase is live.
 * Cookie plan is never used for entitlement.
 */
export async function getPlanForRequest(_request?: NextRequest): Promise<PlanId> {
  try {
    const supabase = await createClient();
    if (!supabase) return 'free';
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'free';
    const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle();
    return normalizePlan(data?.plan);
  } catch {
    return 'free';
  }
}

/**
 * Atomically check + increment AI usage for the authenticated user.
 * Requires a Supabase session. Returns unauthorized when no user.
 */
export async function checkAndIncrementAiUsage(request: NextRequest): Promise<{
  allowed: boolean;
  unauthorized?: boolean;
  plan: PlanId;
  used: number;
  limit: number;
}> {
  const period = currentPeriodKey();

  const supabase = await createClient();
  if (!supabase) {
    // Production / Vercel must have Supabase — refuse cookie bypass
    if (isProductionRuntime()) {
      return {
        allowed: false,
        unauthorized: true,
        plan: 'free',
        used: 0,
        limit: PLAN_AI_LIMITS.free,
      };
    }
    return {
      allowed: false,
      unauthorized: true,
      plan: 'free',
      used: 0,
      limit: PLAN_AI_LIMITS.free,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      allowed: false,
      unauthorized: true,
      plan: 'free',
      used: 0,
      limit: PLAN_AI_LIMITS.free,
    };
  }

  // Resolve plan first for limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle();
  const plan = normalizePlan(profile?.plan);
  const limit = PLAN_AI_LIMITS[plan];

  // Prefer atomic RPC; fall back to guarded update if migration not applied yet
  const { data: rpcRows, error: rpcError } = await supabase.rpc('increment_ai_usage', {
    p_period: period,
    p_limit: limit,
  });

  if (!rpcError && Array.isArray(rpcRows) && rpcRows[0]) {
    const row = rpcRows[0] as { allowed: boolean; used: number; lim: number; plan: string };
    return {
      allowed: Boolean(row.allowed),
      plan: normalizePlan(row.plan || plan),
      used: Number(row.used) || 0,
      limit: Number(row.lim) || limit,
    };
  }

  // Fallback path (pre-migration): still no cookie entitlement
  const { data } = await supabase
    .from('profiles')
    .select('ai_usage_count, ai_usage_period, plan')
    .eq('id', user.id)
    .maybeSingle();

  let used = data?.ai_usage_count ?? 0;
  if (data?.ai_usage_period !== period) used = 0;
  if (used >= limit) {
    return { allowed: false, plan, used, limit };
  }

  const next = used + 1;
  const { error } = await supabase
    .from('profiles')
    .update({ ai_usage_count: next, ai_usage_period: period })
    .eq('id', user.id)
    .eq('ai_usage_count', used); // optimistic lock when period matches

  if (error) {
    // Retry once as period reset case
    await supabase
      .from('profiles')
      .update({ ai_usage_count: 1, ai_usage_period: period })
      .eq('id', user.id);
    return { allowed: true, plan, used: 1, limit };
  }

  void request; // keep signature for call sites
  return { allowed: true, plan, used: next, limit };
}
