/**
 * OpenRouter model routing agent.
 * Prefers free `:free` models; falls back to ultra-cheap policy-safe twins when
 * account privacy/guardrails block free endpoints (common OpenRouter 404).
 */

export type OpenRouterTask = 'script' | 'chat' | 'analysis' | 'sentiment' | 'ideas';

/** Free catalog IDs (may be blocked by account privacy settings). */
export const OPENROUTER_FREE_MODELS = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openai/gpt-oss-20b:free',
  'inclusionai/ling-3.0-tiny:free',
  'poolside/laguna-s-2.1:free',
  'poolside/laguna-xs-2.1:free',
  'cohere/north-mini-code:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-3.5-content-safety:free',
] as const;

/**
 * Ultra-cheap paid twins that usually pass OpenRouter privacy/guardrails when
 * `:free` endpoints are blocked. Pricing is near-zero per token.
 */
export const OPENROUTER_CHEAP_FALLBACK_MODELS = [
  'google/gemma-4-31b-it',
  'google/gemma-4-26b-a4b-it',
  'google/gemma-3-12b-it',
  'google/gemma-3-4b-it',
  'meta-llama/llama-3.1-8b-instruct',
  'meta-llama/llama-3.2-3b-instruct',
  'mistralai/mistral-nemo',
  'mistralai/mistral-small-24b-instruct-2501',
] as const;

export type OpenRouterFreeModel = (typeof OPENROUTER_FREE_MODELS)[number];

const FREE_SET = new Set<string>(OPENROUTER_FREE_MODELS);
const CHEAP_SET = new Set<string>(OPENROUTER_CHEAP_FALLBACK_MODELS);
const ALLOWED_SET = new Set<string>([
  ...OPENROUTER_FREE_MODELS,
  ...OPENROUTER_CHEAP_FALLBACK_MODELS,
]);

/** Free first, then immediate cheap twin so privacy blocks don't burn the whole chain. */
const TASK_CHAINS: Record<OpenRouterTask, readonly string[]> = {
  script: [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-31b-it',
    'google/gemma-3-12b-it',
    'meta-llama/llama-3.1-8b-instruct',
  ],
  analysis: [
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-4-26b-a4b-it',
    'google/gemma-3-12b-it',
    'meta-llama/llama-3.1-8b-instruct',
  ],
  ideas: [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-31b-it',
    'google/gemma-3-12b-it',
    'mistralai/mistral-small-24b-instruct-2501',
  ],
  sentiment: [
    'nvidia/nemotron-3.5-content-safety:free',
    'google/gemma-3-4b-it',
    'meta-llama/llama-3.2-3b-instruct',
    'mistralai/mistral-nemo',
  ],
  chat: [
    'nvidia/nemotron-nano-9b-v2:free',
    'google/gemma-3-4b-it',
    'meta-llama/llama-3.2-3b-instruct',
    'mistralai/mistral-nemo',
  ],
};

export const OPENROUTER_MAX_MODELS = 3;
export const OPENROUTER_ATTEMPTS_PER_MODEL = 2;

export type OpenRouterRouteDecision = {
  task: OpenRouterTask;
  models: string[];
  primary: string;
  strategy: 'quality_first_retry_fallback';
  reason: string;
};

const TASK_REASONS: Record<OpenRouterTask, string> = {
  script: 'Long-form creative script → strongest free, then cheap Gemma/Llama fallbacks',
  analysis: 'Structured trend reasoning → free analysis models, then cheap twins',
  ideas: 'Creative angles → strong generative free models, then cheap twins',
  sentiment: 'Brand safety / sentiment → safety free models, then compact cheap models',
  chat: 'Interactive chat → fast free models, then compact cheap models',
};

export function isOpenRouterFreeModel(model: string): boolean {
  const id = model.trim();
  if (!id) return false;
  if (id === 'openrouter/free') return true;
  if (FREE_SET.has(id)) return true;
  return id.endsWith(':free');
}

export function isOpenRouterAllowedModel(model: string): boolean {
  const id = model.trim();
  if (!id) return false;
  if (ALLOWED_SET.has(id)) return true;
  if (isOpenRouterFreeModel(id)) return true;
  return CHEAP_SET.has(id);
}

export function resolveOpenRouterTask(raw?: string | null): OpenRouterTask {
  const t = (raw || 'chat').trim().toLowerCase();
  if (t === 'script' || t === 'chat' || t === 'analysis' || t === 'sentiment' || t === 'ideas') {
    return t;
  }
  return 'chat';
}

/**
 * Ordered model chain for a task (free first, then cheap paid policy fallbacks).
 */
export function getFreeModelChain(
  task: OpenRouterTask = 'chat',
  preferred?: string | null
): string[] {
  const base = [...(TASK_CHAINS[task] ?? TASK_CHAINS.chat)].filter(isOpenRouterAllowedModel);
  const pref = preferred?.trim();
  const chain: string[] = [];

  if (
    pref &&
    isOpenRouterAllowedModel(pref) &&
    (ALLOWED_SET.has(pref) || isOpenRouterFreeModel(pref))
  ) {
    chain.push(pref);
  }

  for (const id of base) {
    if (!chain.includes(id)) chain.push(id);
  }

  if (chain.length === 0) {
    chain.push('google/gemma-3-4b-it', 'meta-llama/llama-3.1-8b-instruct');
  }

  return chain.slice(0, OPENROUTER_MAX_MODELS);
}

export function selectOpenRouterRoute(
  taskHint?: string | null,
  preferredModel?: string | null
): OpenRouterRouteDecision {
  const task = resolveOpenRouterTask(taskHint);
  const models = getFreeModelChain(task, preferredModel);
  return {
    task,
    models,
    primary: models[0],
    strategy: 'quality_first_retry_fallback',
    reason: TASK_REASONS[task],
  };
}

export function inferTaskFromMessages(
  messages: { role: string; content: string }[]
): OpenRouterTask {
  const blob = messages.map((m) => m.content).join('\n');
  if (/NemoScript|viralScore|Perfect Viral Script|viral script/i.test(blob)) return 'script';
  if (/brand safety|audience sentiment|sentiment analysis|safety score/i.test(blob)) {
    return 'sentiment';
  }
  if (/content angles|content ideas|ready to post|generate.*ideas/i.test(blob)) return 'ideas';
  if (/why (this |it.?s )?trending|trend(ing)? analysis|predicted trajectory/i.test(blob)) {
    return 'analysis';
  }
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  if (/NemoScript|viralScore|Perfect Viral Script/i.test(system)) return 'script';
  return 'chat';
}

/** True when OpenRouter rejected the model due to privacy/ZDR/guardrails. */
export function isOpenRouterPrivacyBlock(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /guardrail restrictions and data policy|data policy|zero data retention|settings\/privacy/i.test(
    msg
  );
}
