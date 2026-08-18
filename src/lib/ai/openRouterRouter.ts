/** Agent docs: ./openRouterAgent.md — task→model OpenRouter router. */
/**
 * OpenRouter model routing agent.
 * Prefer allowlisted `:free` / `openrouter/free` models only.
 * Cheap paid twins are opt-in via OPENROUTER_ALLOW_PAID_FALLBACK=true.
 */

export type OpenRouterTask = 'script' | 'chat' | 'analysis' | 'sentiment' | 'ideas';

/** Free catalog IDs (primary routing). */
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
 * Ultra-cheap paid twins for emergency fallback when free endpoints fail.
 * Included in chains only when OPENROUTER_ALLOW_PAID_FALLBACK=true.
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

/** Speed-first free chains (smaller/faster free models before huge queue-prone ones). */
const FREE_TASK_CHAINS: Record<OpenRouterTask, readonly string[]> = {
  script: [
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-4-31b-it:free',
    'openai/gpt-oss-20b:free',
  ],
  analysis: [
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'openai/gpt-oss-20b:free',
    'google/gemma-4-26b-a4b-it:free',
  ],
  ideas: [
    'openai/gpt-oss-20b:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'google/gemma-4-26b-a4b-it:free',
  ],
  sentiment: [
    'nvidia/nemotron-nano-9b-v2:free',
    'inclusionai/ling-3.0-tiny:free',
    'nvidia/nemotron-3.5-content-safety:free',
  ],
  chat: [
    'nvidia/nemotron-nano-9b-v2:free',
    'inclusionai/ling-3.0-tiny:free',
    'openai/gpt-oss-20b:free',
  ],
};

/** Paid twins appended only when OPENROUTER_ALLOW_PAID_FALLBACK=true. */
const PAID_TASK_FALLBACKS: Record<OpenRouterTask, readonly string[]> = {
  script: ['google/gemma-4-31b-it', 'google/gemma-3-12b-it', 'meta-llama/llama-3.1-8b-instruct'],
  analysis: [
    'google/gemma-4-26b-a4b-it',
    'google/gemma-3-12b-it',
    'meta-llama/llama-3.1-8b-instruct',
  ],
  ideas: [
    'google/gemma-4-31b-it',
    'google/gemma-3-12b-it',
    'mistralai/mistral-small-24b-instruct-2501',
  ],
  sentiment: ['google/gemma-3-4b-it', 'meta-llama/llama-3.2-3b-instruct', 'mistralai/mistral-nemo'],
  chat: ['google/gemma-3-4b-it', 'meta-llama/llama-3.2-3b-instruct', 'mistralai/mistral-nemo'],
};

export const OPENROUTER_MAX_MODELS = 3;
/** One attempt per model — free queues make same-model retries expensive. */
export const OPENROUTER_ATTEMPTS_PER_MODEL = 1;
/** Per-model HTTP timeout (ms). Prevents 10–20 minute free-queue hangs. */
export const OPENROUTER_REQUEST_TIMEOUT_MS = 35_000;

export type OpenRouterRouteDecision = {
  task: OpenRouterTask;
  models: string[];
  primary: string;
  strategy: 'quality_first_retry_fallback';
  reason: string;
  paidFallbackEnabled: boolean;
};

const TASK_REASONS: Record<OpenRouterTask, string> = {
  script: 'Viral scripts → free Google Gemma on OpenRouter (Gemini Flash :free is not offered)',
  analysis: 'Trend analysis → compact free models first',
  ideas: 'Content ideas → fast generative free models',
  sentiment: 'Sentiment → compact free classifiers',
  chat: 'Chat → fastest free models',
};

type EnvLike = Record<string, string | undefined>;

/** Emergency paid twins — off by default now that :free endpoints work. */
export function isOpenRouterPaidFallbackAllowed(env: EnvLike = process.env): boolean {
  return env.OPENROUTER_ALLOW_PAID_FALLBACK?.trim().toLowerCase() === 'true';
}

export function isOpenRouterFreeModel(model: string): boolean {
  const id = model.trim();
  if (!id) return false;
  if (id === 'openrouter/free') return true;
  if (FREE_SET.has(id)) return true;
  return id.endsWith(':free');
}

export function isOpenRouterCheapFallbackModel(model: string): boolean {
  return CHEAP_SET.has(model.trim());
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

function buildTaskBaseChain(task: OpenRouterTask, paidFallbackEnabled: boolean): string[] {
  const free = [...(FREE_TASK_CHAINS[task] ?? FREE_TASK_CHAINS.chat)];
  if (!paidFallbackEnabled) {
    return free.filter(isOpenRouterFreeModel);
  }
  // Keep one strong free primary, then emergency cheap twins within the 3-slot budget.
  const paid = [...(PAID_TASK_FALLBACKS[task] ?? PAID_TASK_FALLBACKS.chat)];
  const chain: string[] = [];
  if (free[0]) chain.push(free[0]);
  for (const id of paid) {
    if (!chain.includes(id)) chain.push(id);
  }
  return chain;
}

/**
 * Ordered model chain for a task.
 * Default: free-only quality-first. With OPENROUTER_ALLOW_PAID_FALLBACK=true,
 * primary free + cheap paid twins.
 */
export function getFreeModelChain(
  task: OpenRouterTask = 'chat',
  preferred?: string | null,
  env: EnvLike = process.env
): string[] {
  const paidFallbackEnabled = isOpenRouterPaidFallbackAllowed(env);
  const base = buildTaskBaseChain(task, paidFallbackEnabled).filter(isOpenRouterAllowedModel);
  const pref = preferred?.trim();
  const chain: string[] = [];

  if (pref && isOpenRouterAllowedModel(pref)) {
    const prefOk =
      isOpenRouterFreeModel(pref) || (paidFallbackEnabled && isOpenRouterCheapFallbackModel(pref));
    if (prefOk) chain.push(pref);
  }

  for (const id of base) {
    if (!chain.includes(id)) chain.push(id);
  }

  if (chain.length === 0) {
    chain.push('openai/gpt-oss-20b:free', 'nvidia/nemotron-nano-9b-v2:free');
  }

  return chain.slice(0, OPENROUTER_MAX_MODELS);
}

export function selectOpenRouterRoute(
  taskHint?: string | null,
  preferredModel?: string | null,
  env: EnvLike = process.env
): OpenRouterRouteDecision {
  const task = resolveOpenRouterTask(taskHint);
  const paidFallbackEnabled = isOpenRouterPaidFallbackAllowed(env);
  const models = getFreeModelChain(task, preferredModel, env);
  return {
    task,
    models,
    primary: models[0],
    strategy: 'quality_first_retry_fallback',
    reason: paidFallbackEnabled
      ? `${TASK_REASONS[task]} (paid emergency fallback enabled)`
      : TASK_REASONS[task],
    paidFallbackEnabled,
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
