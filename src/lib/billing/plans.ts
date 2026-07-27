import type { PlanId } from '@/lib/billing/usage';

export const PLAN_AI_LIMITS: Record<PlanId, number> = {
  free: 5,
  pro: 100,
  agency: 10_000,
};

export { type PlanId };
