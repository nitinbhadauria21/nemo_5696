import type { ChatMessage, ProviderId } from '@/lib/ai/providers';
import {
  OPENROUTER_CHEAP_FALLBACK_MODELS,
  OPENROUTER_FREE_MODELS,
  isOpenRouterAllowedModel,
} from '@/lib/ai/openRouterRouter';

export const ALLOWED_MODELS: Record<ProviderId, readonly string[]> = {
  OPEN_AI: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  ANTHROPIC: ['claude-sonnet-4-6', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
  GEMINI: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  PERPLEXITY: ['sonar', 'sonar-pro'],
  // Free primary; cheap paid twins remain allowlisted for OPENROUTER_ALLOW_PAID_FALLBACK
  OPENROUTER: [...OPENROUTER_FREE_MODELS, ...OPENROUTER_CHEAP_FALLBACK_MODELS],
};

export const MAX_MESSAGES = 40;
export const MAX_TOTAL_CHARS = 48_000;
/** Viral scripts need longer completions; keep a hard ceiling for cost control. */
export const MAX_OUTPUT_TOKENS = 4096;

export type ValidatedChatPayload = {
  provider: ProviderId;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  /** Optional task hint for OpenRouter free-model routing. */
  task?: string;
};

export type ValidateChatPayloadResult =
  ({ ok: true } & ValidatedChatPayload) | { ok: false; status: number; code: string };

/**
 * Pure allowlist / size validation for AI chat-completion.
 * Auth and anonymous rejection stay at the route layer (E2E later).
 */
export function validateChatPayload(body: {
  provider?: string;
  model?: string;
  messages?: ChatMessage[];
  parameters?: Record<string, unknown>;
  task?: string;
}): ValidateChatPayloadResult {
  const provider = body.provider as ProviderId | undefined;
  if (!provider || !(provider in ALLOWED_MODELS)) {
    return { ok: false, status: 400, code: 'invalid_provider' };
  }

  let model = body.model?.trim() ?? '';
  // OpenRouter: server picks the free model; client may send "auto" / omit.
  if (provider === 'OPENROUTER') {
    if (!model || model.toLowerCase() === 'auto') {
      model = ALLOWED_MODELS.OPENROUTER[0];
    } else if (!ALLOWED_MODELS.OPENROUTER.includes(model) && !isOpenRouterAllowedModel(model)) {
      return { ok: false, status: 400, code: 'invalid_model' };
    }
  } else if (!model || !ALLOWED_MODELS[provider].includes(model)) {
    return { ok: false, status: 400, code: 'invalid_model' };
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return { ok: false, status: 400, code: 'invalid_messages' };
  }
  let total = 0;
  for (const m of messages) {
    if (!m || (m.role !== 'system' && m.role !== 'user' && m.role !== 'assistant')) {
      return { ok: false, status: 400, code: 'invalid_messages' };
    }
    if (typeof m.content !== 'string') {
      return { ok: false, status: 400, code: 'invalid_messages' };
    }
    total += m.content.length;
  }
  if (total > MAX_TOTAL_CHARS) {
    return { ok: false, status: 400, code: 'payload_too_large' };
  }
  const rawMax = Number(body.parameters?.max_tokens ?? 1024);
  const maxTokens = Math.min(
    MAX_OUTPUT_TOKENS,
    Math.max(1, Number.isFinite(rawMax) ? Math.floor(rawMax) : 1024)
  );
  const task = typeof body.task === 'string' ? body.task : undefined;
  return { ok: true, provider, model, messages, maxTokens, task };
}
