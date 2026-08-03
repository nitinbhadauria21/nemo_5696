import { NextRequest, NextResponse } from 'next/server';
import { createCompletion, type ChatMessage, type ProviderId } from '@/lib/ai/providers';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { requireAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';
import { logAiGeneration } from '@/lib/ai/logGeneration';

const ALLOWED_MODELS: Record<ProviderId, readonly string[]> = {
  OPEN_AI: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  ANTHROPIC: ['claude-sonnet-4-6', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
  GEMINI: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  PERPLEXITY: ['sonar', 'sonar-pro'],
};

const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 48_000;
const MAX_OUTPUT_TOKENS = 2048;

function safeClientError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

function validatePayload(body: {
  provider?: string;
  model?: string;
  messages?: ChatMessage[];
  parameters?: Record<string, unknown>;
}): { ok: true; provider: ProviderId; model: string; messages: ChatMessage[]; maxTokens: number } | { ok: false; status: number; code: string } {
  const provider = body.provider as ProviderId | undefined;
  if (!provider || !(provider in ALLOWED_MODELS)) {
    return { ok: false, status: 400, code: 'invalid_provider' };
  }
  const model = body.model?.trim();
  if (!model || !ALLOWED_MODELS[provider].includes(model)) {
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
  return { ok: true, provider, model, messages, maxTokens };
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return safeClientError(400, 'invalid_json');
  }

  const validated = validatePayload(body as Parameters<typeof validatePayload>[0]);
  if (!validated.ok) {
    return safeClientError(validated.status, validated.code);
  }

  const usage = await checkAndIncrementAiUsage(request);
  if (usage.unauthorized) {
    return safeClientError(401, 'unauthorized');
  }
  if (!usage.allowed) {
    return NextResponse.json(
      { error: 'ai_limit_reached', usage: { plan: usage.plan, used: usage.used, limit: usage.limit } },
      { status: 402 }
    );
  }

  const { provider, model, messages, maxTokens } = validated;
  const stream = Boolean(body.stream);

  try {
    const result = await createCompletion({
      provider,
      model,
      messages,
      stream,
      parameters: { max_tokens: maxTokens, temperature: 0.7 },
    });

    void trackEvent({
      userId,
      eventName: 'ai.chat_completion',
      eventCategory: 'ai',
      properties: { provider, model, stream, plan: usage.plan },
      request,
    });
    void logAiGeneration({
      userId,
      generationType: 'chat_completion',
      model: `${provider}/${model}`,
      success: true,
      properties: { stream, plan: usage.plan },
    });

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
            for await (const chunk of result as AsyncIterable<unknown>) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`)
              );
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          } catch {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'ai_unavailable' })}\n\n`)
            );
            controller.close();
          }
        },
      });
      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI chat-completion failed', {
      userId,
      provider,
      model,
      message: error instanceof Error ? error.message : 'unknown',
    });
    void logAiGeneration({
      userId,
      generationType: 'chat_completion',
      model: `${provider}/${model}`,
      success: false,
      error: 'ai_unavailable',
    });
    return safeClientError(503, 'ai_unavailable');
  }
}
