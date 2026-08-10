/**
 * OpenRouter free-model routing agent.
 * Picks the strongest free model for each task, then lighter fallbacks.
 * Only IDs ending in `:free` or `openrouter/free` are eligible.
 */

export type OpenRouterTask = 'script' | 'chat' | 'analysis' | 'sentiment' | 'ideas';

/** Curated free models verified against OpenRouter's public catalog. */
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

export type OpenRouterFreeModel = (typeof OPENROUTER_FREE_MODELS)[number];

const FREE_SET = new Set<string>(OPENROUTER_FREE_MODELS);

/**
 * Quality-first chains (option C):
 * - script / analysis / ideas → heavier instruction / reasoning models first
 * - sentiment → safety-tuned then compact classifiers
 * - chat → light / fast models first
 */
const TASK_CHAINS: Record<OpenRouterTask, readonly string[]> = {
  script: [
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'openai/gpt-oss-20b:free',
  ],
  analysis: [
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-20b:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  ],
  ideas: [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'openai/gpt-oss-20b:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
  ],
  sentiment: [
    'nvidia/nemotron-3.5-content-safety:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'google/gemma-4-26b-a4b-it:free',
    'inclusionai/ling-3.0-tiny:free',
  ],
  chat: [
    'nvidia/nemotron-nano-9b-v2:free',
    'inclusionai/ling-3.0-tiny:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'google/gemma-4-26b-a4b-it:free',
  ],
};

/** Max distinct free models tried per request. */
export const OPENROUTER_MAX_MODELS = 3;
/** Attempts per model before moving to the next (option B). */
export const OPENROUTER_ATTEMPTS_PER_MODEL = 2;

export type OpenRouterRouteDecision = {
  task: OpenRouterTask;
  models: string[];
  primary: string;
  strategy: 'quality_first_retry_fallback';
  reason: string;
};

const TASK_REASONS: Record<OpenRouterTask, string> = {
  script: 'Long-form creative script → strongest free instruction models first',
  analysis: 'Structured trend reasoning → mid/heavy free models with reasoning fallbacks',
  ideas: 'Creative angles → strong generative free models first',
  sentiment: 'Brand safety / sentiment → safety-tuned then compact free models',
  chat: 'Interactive chat → fast light free models first',
};

export function isOpenRouterFreeModel(model: string): boolean {
  const id = model.trim();
  if (!id) return false;
  if (id === 'openrouter/free') return true;
  if (FREE_SET.has(id)) return true;
  return id.endsWith(':free');
}

export function resolveOpenRouterTask(raw?: string | null): OpenRouterTask {
  const t = (raw || 'chat').trim().toLowerCase();
  if (t === 'script' || t === 'chat' || t === 'analysis' || t === 'sentiment' || t === 'ideas') {
    return t;
  }
  return 'chat';
}

/**
 * Ordered free-model chain for a task (quality-first).
 * If `preferred` is an allowlisted free id (e.g. AI_MODEL), it is tried first.
 */
export function getFreeModelChain(
  task: OpenRouterTask = 'chat',
  preferred?: string | null
): string[] {
  const base = [...(TASK_CHAINS[task] ?? TASK_CHAINS.chat)].filter(isOpenRouterFreeModel);
  const pref = preferred?.trim();
  const chain: string[] = [];

  if (pref && isOpenRouterFreeModel(pref) && FREE_SET.has(pref)) {
    chain.push(pref);
  }

  for (const id of base) {
    if (!chain.includes(id)) chain.push(id);
  }

  if (chain.length === 0) {
    chain.push('openrouter/free');
  }

  return chain.slice(0, OPENROUTER_MAX_MODELS);
}

/**
 * Routing agent: decide which free OpenRouter models handle this task.
 */
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

/** Infer task from chat messages when the client does not send `task`. */
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
