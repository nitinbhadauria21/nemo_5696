/**
 * Provider-agnostic LLM client (OpenAI / Anthropic / Gemini / OpenRouter / Perplexity).
 * Returns OpenAI-compatible chat completion shapes for the frontend.
 */

import { OPENROUTER_ATTEMPTS_PER_MODEL, OPENROUTER_MAX_MODELS } from '@/lib/ai/openRouterRouter';

export type ProviderId = 'OPEN_AI' | 'ANTHROPIC' | 'GEMINI' | 'PERPLEXITY' | 'OPENROUTER';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CompletionParams = {
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
};

function getApiKey(provider: ProviderId): string | undefined {
  const keys: Record<ProviderId, string | undefined> = {
    OPEN_AI: process.env.OPENAI_API_KEY,
    ANTHROPIC: process.env.ANTHROPIC_API_KEY,
    GEMINI: process.env.GEMINI_API_KEY,
    PERPLEXITY: process.env.PERPLEXITY_API_KEY,
    OPENROUTER: process.env.OPENROUTER_API_KEY,
  };
  return keys[provider];
}

function openRouterSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nemo-5696.vercel.app').trim();
  return raw.replace(/\/$/, '') || 'https://nemo-5696.vercel.app';
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text: string }).text ?? '');
        }
        return '';
      })
      .join('');
  }
  return '';
}

function openAiShape(content: string, model: string) {
  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
  };
}

function openAiChunk(content: string, model: string) {
  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta: { content }, finish_reason: null }],
  };
}

async function completeOpenAiCompatible(
  url: string,
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean,
  parameters: CompletionParams,
  llmProvider: ProviderId,
  extraHeaders?: Record<string, string>
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature: parameters.temperature ?? 0.7,
      max_tokens: parameters.max_tokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    const err = new Error(details || res.statusText) as Error & {
      statusCode?: number;
      llmProvider?: string;
    };
    err.statusCode = res.status;
    err.llmProvider = llmProvider;
    throw err;
  }

  return res;
}

async function completeOpenAI(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean,
  parameters: CompletionParams
) {
  return completeOpenAiCompatible(
    'https://api.openai.com/v1/chat/completions',
    model,
    messages,
    apiKey,
    stream,
    parameters,
    'OPEN_AI'
  );
}

async function completePerplexity(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean,
  parameters: CompletionParams
) {
  return completeOpenAiCompatible(
    'https://api.perplexity.ai/chat/completions',
    model,
    messages,
    apiKey,
    stream,
    parameters,
    'PERPLEXITY'
  );
}

async function completeOpenRouter(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean,
  parameters: CompletionParams
) {
  return completeOpenAiCompatible(
    'https://openrouter.ai/api/v1/chat/completions',
    model,
    messages,
    apiKey,
    stream,
    parameters,
    'OPENROUTER',
    {
      'HTTP-Referer': openRouterSiteUrl(),
      'X-Title': 'Nemo',
    }
  );
}

async function completeAnthropic(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  parameters: CompletionParams
) {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const anthropicMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: parameters.max_tokens ?? 2048,
      temperature: parameters.temperature ?? 0.7,
      system: system || undefined,
      messages: anthropicMessages,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    const err = new Error(details || res.statusText) as Error & {
      statusCode?: number;
      llmProvider?: string;
    };
    err.statusCode = res.status;
    err.llmProvider = 'ANTHROPIC';
    throw err;
  }

  const data = await res.json();
  const content = extractText(data?.content);
  return openAiShape(content, model);
}

async function* streamAnthropic(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  parameters: CompletionParams
) {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const anthropicMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: parameters.max_tokens ?? 2048,
      temperature: parameters.temperature ?? 0.7,
      system: system || undefined,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    const err = new Error(details || res.statusText) as Error & {
      statusCode?: number;
      llmProvider?: string;
    };
    err.statusCode = res.status;
    err.llmProvider = 'ANTHROPIC';
    throw err;
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Anthropic stream unavailable');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === 'content_block_delta' && event.delta?.text) {
          yield openAiChunk(event.delta.text, model);
        }
      } catch {
        // skip malformed SSE
      }
    }
  }
}

async function completeGemini(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  parameters: CompletionParams
) {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: {
        temperature: parameters.temperature ?? 0.7,
        maxOutputTokens: parameters.max_tokens ?? 2048,
      },
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    const err = new Error(details || res.statusText) as Error & {
      statusCode?: number;
      llmProvider?: string;
    };
    err.statusCode = res.status;
    err.llmProvider = 'GEMINI';
    throw err;
  }

  const data = await res.json();
  const content =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
    '';
  return openAiShape(content, model);
}

async function* streamGemini(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  parameters: CompletionParams
) {
  // Gemini streaming via SSE; fall back to single completion chunked by words if stream fails
  const full = await completeGemini(model, messages, apiKey, parameters);
  const text = full.choices[0]?.message?.content ?? '';
  const parts = text.match(/.{1,24}/g) ?? [text];
  for (const part of parts) {
    yield openAiChunk(part, model);
  }
}

async function* streamOpenAiCompatible(res: Response, model: string) {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('Stream unavailable');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const chunk = JSON.parse(payload);
        if (chunk.choices?.[0]?.delta?.content) {
          yield chunk;
        } else if (chunk.choices?.[0]?.delta) {
          yield chunk;
        }
      } catch {
        // skip
      }
    }
  }
  // silence unused model warning in edge cases
  void model;
}

export type AiProviderError = Error & {
  statusCode?: number;
  code?: string;
  llmProvider?: string;
};

export function requireApiKey(provider: ProviderId): string {
  const key = getApiKey(provider);
  if (!key) {
    const err = new Error(`${provider} API key is not configured`) as AiProviderError;
    err.statusCode = 503;
    err.code = 'ai_not_configured';
    err.llmProvider = provider;
    throw err;
  }
  return key;
}

/** Local/dev only: set AI_DEV_STUB=1 (never honored in production). */
function allowDevStub(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.AI_DEV_STUB === '1';
}

function devStubCompletion(model: string, messages: ChatMessage[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const wantsScriptJson =
    /viralScore|rawMarkdown|"script"/i.test(lastUser) || /NemoScript/i.test(lastUser);
  const content = wantsScriptJson
    ? JSON.stringify({
        script: {
          framework: 'hears',
          frameworkLabel: 'HEARS — Dev stub',
          frameworkReason:
            'AI_DEV_STUB is enabled; replace with a real provider key for production.',
          hook: 'Stop scrolling — this is a local AI stub, not a live model.',
          viralScore: 70,
          timestamps: ['0:00 - Hook', '0:05 - Value', '0:12 - CTA'],
          deliveryNotes:
            'Dev stub only. Set OPENROUTER_API_KEY (or your AI_PROVIDER key) for real scripts.',
          rawMarkdown:
            '# Scene 1: Dev Stub Hook\n[Visual Cue]: Host looks at camera.\n[Audio Script]: This is a local AI_DEV_STUB response.\n\n# Scene 2: Next Step\n[Visual Cue]: Show settings screen.\n[Audio Script]: Add your real API key in Vercel and redeploy.\n\nCTA: Comment NEMO for the real workflow!',
        },
      })
    : `[AI_DEV_STUB] Local stub response. Set OPENROUTER_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY / PERPLEXITY_API_KEY for live AI.\n\nPrompt preview: ${lastUser.slice(0, 240)}`;
  return openAiShape(content, model);
}

export function getAiErrorCode(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as AiProviderError).code === 'string'
  ) {
    return (error as AiProviderError).code!;
  }
  const message = error instanceof Error ? error.message : '';
  if (/API key is not configured/i.test(message)) return 'ai_not_configured';
  const status =
    error && typeof error === 'object' && 'statusCode' in error
      ? Number((error as AiProviderError).statusCode)
      : undefined;
  if (status === 429 || /rate.?limit/i.test(message)) return 'rate_limited';
  if (/empty/i.test(message)) return 'ai_empty_response';
  return 'ai_unavailable';
}

function completionText(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const r = result as {
    choices?: { message?: { content?: unknown } }[];
  };
  return extractText(r.choices?.[0]?.message?.content);
}

function shouldRetryOpenRouter(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const status = (error as AiProviderError).statusCode;
  if (status === 401 || status === 403) return false;
  if (status === 400 || status === 404) return true; // bad/unavailable free model → try next
  if (status === 429 || (typeof status === 'number' && status >= 500)) return true;
  if (/empty/i.test(error.message)) return true;
  if (status === undefined) return true; // network / parse
  return status >= 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * OpenRouter quality path (B+C):
 * For each free model (up to 3), try twice on transient/empty errors, then fall back.
 */
export async function createCompletionWithFallbacks(options: {
  provider: ProviderId;
  models: string[];
  messages: ChatMessage[];
  stream?: boolean;
  parameters?: CompletionParams;
  /** Attempts per model before moving on (default 2). */
  attemptsPerModel?: number;
}): Promise<Response | Record<string, unknown> | AsyncGenerator<Record<string, unknown>>> {
  const models = options.models.filter(Boolean).slice(0, OPENROUTER_MAX_MODELS);
  if (models.length === 0) {
    throw new Error('No models provided for completion');
  }

  if (options.provider !== 'OPENROUTER') {
    return createCompletion({ ...options, model: models[0] });
  }

  const attemptsPerModel = Math.max(1, options.attemptsPerModel ?? OPENROUTER_ATTEMPTS_PER_MODEL);
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
      try {
        const result = await createCompletion({ ...options, model });
        if (!options.stream) {
          const text = completionText(result);
          if (!text.trim()) {
            lastError = Object.assign(new Error('AI returned an empty response'), {
              code: 'ai_empty_response',
              statusCode: 502,
              llmProvider: 'OPENROUTER',
            });
            if (attempt < attemptsPerModel) {
              await sleep(250 * attempt);
              continue;
            }
            break; // next model
          }
        }
        if (attempt > 1 || i > 0) {
          console.info('[openrouter] succeeded', { model, attempt, modelIndex: i });
        }
        return result;
      } catch (error) {
        lastError = error;
        const retryable = shouldRetryOpenRouter(error);
        const moreAttempts = attempt < attemptsPerModel;
        const moreModels = i < models.length - 1;

        if (!retryable) throw error;

        if (moreAttempts) {
          console.warn('[openrouter] retry same model', {
            model,
            attempt,
            message: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
          });
          await sleep(300 * attempt);
          continue;
        }

        if (moreModels) {
          console.warn('[openrouter] fallback to next model', {
            from: model,
            to: models[i + 1],
            attempt,
          });
          break;
        }

        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All OpenRouter free models failed');
}

export async function createCompletion(options: {
  provider: ProviderId;
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  parameters?: CompletionParams;
}): Promise<Response | Record<string, unknown> | AsyncGenerator<Record<string, unknown>>> {
  const { provider, model, messages, stream = false, parameters = {} } = options;

  let apiKey: string;
  try {
    apiKey = requireApiKey(provider);
  } catch (error) {
    if (allowDevStub()) {
      if (stream) {
        const stub = devStubCompletion(model, messages);
        const text = extractText(
          (stub as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message
            ?.content
        );
        async function* stubStream() {
          yield openAiChunk(text, model);
        }
        return stubStream();
      }
      return devStubCompletion(model, messages);
    }
    throw error;
  }

  if (provider === 'OPEN_AI' || provider === 'PERPLEXITY' || provider === 'OPENROUTER') {
    const res =
      provider === 'OPEN_AI'
        ? await completeOpenAI(model, messages, apiKey, stream, parameters)
        : provider === 'PERPLEXITY'
          ? await completePerplexity(model, messages, apiKey, stream, parameters)
          : await completeOpenRouter(model, messages, apiKey, stream, parameters);

    if (stream) {
      return streamOpenAiCompatible(res, model);
    }
    return res.json();
  }

  if (provider === 'ANTHROPIC') {
    if (stream) return streamAnthropic(model, messages, apiKey, parameters);
    return completeAnthropic(model, messages, apiKey, parameters);
  }

  if (provider === 'GEMINI') {
    if (stream) return streamGemini(model, messages, apiKey, parameters);
    return completeGemini(model, messages, apiKey, parameters);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
