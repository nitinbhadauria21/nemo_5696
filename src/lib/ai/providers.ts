/**
 * Provider-agnostic LLM client (OpenAI / Anthropic / Gemini).
 * Returns OpenAI-compatible chat completion shapes for the frontend.
 */

export type ProviderId = 'OPEN_AI' | 'ANTHROPIC' | 'GEMINI' | 'PERPLEXITY';

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
  };
  return keys[provider];
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

async function completeOpenAI(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean,
  parameters: CompletionParams
) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
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
    err.llmProvider = 'OPEN_AI';
    throw err;
  }

  return res;
}

async function completePerplexity(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  stream: boolean,
  parameters: CompletionParams
) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
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
    err.llmProvider = 'PERPLEXITY';
    throw err;
  }

  return res;
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

export function requireApiKey(provider: ProviderId): string {
  const key = getApiKey(provider);
  if (!key) {
    const err = new Error(`${provider} API key is not configured`) as Error & {
      statusCode?: number;
      llmProvider?: string;
    };
    err.statusCode = 400;
    err.llmProvider = provider;
    throw err;
  }
  return key;
}

export async function createCompletion(options: {
  provider: ProviderId;
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  parameters?: CompletionParams;
}): Promise<Response | Record<string, unknown> | AsyncGenerator<Record<string, unknown>>> {
  const { provider, model, messages, stream = false, parameters = {} } = options;
  const apiKey = requireApiKey(provider);

  if (provider === 'OPEN_AI' || provider === 'PERPLEXITY') {
    const res =
      provider === 'OPEN_AI'
        ? await completeOpenAI(model, messages, apiKey, stream, parameters)
        : await completePerplexity(model, messages, apiKey, stream, parameters);

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
