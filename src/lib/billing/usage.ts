import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

function currentPeriodKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function readCookiePlan(request: NextRequest): PlanId {
  const plan = request.cookies.get('nemo_plan')?.value as PlanId | undefined;
  if (plan === 'pro' || plan === 'agency' || plan === 'free') return plan;
  return 'free';
}

function readCookieUsage(request: NextRequest): { count: number; period: string } {
  const period = request.cookies.get('nemo_ai_period')?.value || currentPeriodKey();
  const count = Number(request.cookies.get('nemo_ai_count')?.value || '0');
  if (period !== currentPeriodKey()) return { count: 0, period: currentPeriodKey() };
  return { count: Number.isFinite(count) ? count : 0, period };
}

export async function getPlanForRequest(request: NextRequest): Promise<PlanId> {
  try {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle();
        if (data?.plan === 'pro' || data?.plan === 'agency' || data?.plan === 'free') {
          return data.plan;
        }
      }
    }
  } catch {
    // fall through
  }
  return readCookiePlan(request);
}

export async function checkAndIncrementAiUsage(request: NextRequest): Promise<{
  allowed: boolean;
  plan: PlanId;
  used: number;
  limit: number;
}> {
  const plan = await getPlanForRequest(request);
  const limit = PLAN_AI_LIMITS[plan];
  const period = currentPeriodKey();

  try {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
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
        await supabase
          .from('profiles')
          .update({ ai_usage_count: used + 1, ai_usage_period: period })
          .eq('id', user.id);
        return { allowed: true, plan, used: used + 1, limit };
      }
    }
  } catch {
    // cookie fallback
  }

  const cookieUsage = readCookieUsage(request);
  if (cookieUsage.count >= limit) {
    return { allowed: false, plan, used: cookieUsage.count, limit };
  }

  // Cookie increment is applied by the route via Set-Cookie in a helper response if needed.
  // For streaming responses we rely on client PlanProvider / local counters for UX;
  // server still enforces when cookies are present.
  return { allowed: true, plan, used: cookieUsage.count + 1, limit };
}

export function buildUsageCookies(used: number) {
  const period = currentPeriodKey();
  return [
    `nemo_ai_count=${used}; Path=/; SameSite=Lax; Max-Age=2678400`,
    `nemo_ai_period=${period}; Path=/; SameSite=Lax; Max-Age=2678400`,
  ];
}
