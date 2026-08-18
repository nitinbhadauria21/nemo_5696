import { ALLOWED_MODELS } from '@/lib/ai/requestPolicy';
import {
  createCompletion,
  createCompletionWithFallbacks,
  type ProviderId,
} from '@/lib/ai/providers';
import {
  getFreeModelChain,
  selectOpenRouterRoute,
  type OpenRouterTask,
} from '@/lib/ai/openRouterRouter';
import { untilRealResult } from '@/lib/loop/untilRealResult';

function extractText(result: unknown): string {
  if (!result || typeof result !== 'object') return String(result ?? '');
  const r = result as Record<string, unknown>;
  if (typeof r.content === 'string') return r.content;
  if (Array.isArray(r.content)) {
    return r.content
      .map((block) =>
        typeof block === 'object' && block && 'text' in block
          ? String((block as { text: string }).text)
          : ''
      )
      .join('\n');
  }
  if (r.choices && Array.isArray(r.choices)) {
    const choice = r.choices[0] as { message?: { content?: string } };
    return choice?.message?.content ?? '';
  }
  return JSON.stringify(result);
}

/** Map env aliases like OPENAI → OPEN_AI so runPrompt matches ALLOWED_MODELS. */
export function resolveAiProvider(raw?: string | null): ProviderId {
  const normalized = (raw || 'OPENROUTER').trim().toUpperCase().replace(/-/g, '_');
  const aliases: Record<string, ProviderId> = {
    ANTHROPIC: 'ANTHROPIC',
    CLAUDE: 'ANTHROPIC',
    OPENAI: 'OPEN_AI',
    OPEN_AI: 'OPEN_AI',
    GEMINI: 'GEMINI',
    GOOGLE: 'GEMINI',
    PERPLEXITY: 'PERPLEXITY',
    OPENROUTER: 'OPENROUTER',
    OPEN_ROUTER: 'OPENROUTER',
    OR: 'OPENROUTER',
  };
  const provider = aliases[normalized];
  if (provider && provider in ALLOWED_MODELS) return provider;
  return 'OPENROUTER';
}

export function resolveAiModel(provider: ProviderId, raw?: string | null): string {
  const fromEnv = raw?.trim();
  if (provider === 'OPENROUTER') {
    const chain = getFreeModelChain('chat', fromEnv);
    return chain[0];
  }
  if (fromEnv && ALLOWED_MODELS[provider].includes(fromEnv)) return fromEnv;
  if (provider === 'ANTHROPIC') return ALLOWED_MODELS.ANTHROPIC[0];
  if (provider === 'GEMINI') return ALLOWED_MODELS.GEMINI[0];
  if (provider === 'PERPLEXITY') return ALLOWED_MODELS.PERPLEXITY[0];
  return ALLOWED_MODELS.OPEN_AI[0];
}

export async function runAiPrompt(
  prompt: string,
  options?: { task?: OpenRouterTask | string }
): Promise<string> {
  const provider = resolveAiProvider(process.env.AI_PROVIDER);

  if (provider === 'OPENROUTER') {
    const route = selectOpenRouterRoute(options?.task, process.env.AI_MODEL);
    console.info('[openrouter-agent]', {
      task: route.task,
      primary: route.primary,
      models: route.models,
      strategy: route.strategy,
    });
    const text = await untilRealResult({
      attempts: 2,
      delayMs: (n) => 250 * n,
      isReal: (value) => Boolean(value && value.trim()),
      run: async () => {
        try {
          const result = await createCompletionWithFallbacks({
            provider,
            models: route.models,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
          });
          return extractText(result).trim();
        } catch {
          return '';
        }
      },
    });
    if (!text) {
      throw Object.assign(new Error('AI returned an empty response'), {
        code: 'ai_empty_response',
        statusCode: 502,
      });
    }
    return text;
  }

  const model = resolveAiModel(provider, process.env.AI_MODEL);
  const result = await createCompletion({
    provider,
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return extractText(result);
}
