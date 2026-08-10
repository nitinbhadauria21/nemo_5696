export type PlanId = 'free' | 'pro' | 'agency';

/** Monthly AI generation caps (OpenRouter free-model era — soft product limits, not API cost). */
export const PLAN_AI_LIMITS: Record<PlanId, number> = {
  free: 500,
  pro: 5_000,
  agency: 50_000,
};
