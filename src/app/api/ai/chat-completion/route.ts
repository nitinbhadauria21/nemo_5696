import { NextRequest, NextResponse } from 'next/server';
import {
  createCompletion,
  createCompletionWithFallbacks,
  getAiErrorCode,
} from '@/lib/ai/providers';
import { validateChatPayload } from '@/lib/ai/requestPolicy';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { requireAuthUserId } from '@/lib/api/auth';
import { getClientIp } from '@/lib/api/clientIp';
import { enforceAiHttpRateLimits } from '@/lib/ai/rateLimit';
import { trackEvent } from '@/lib/analytics/track';
import { logAiGeneration } from '@/lib/ai/logGeneration';
import { resolveAiProvider } from '@/lib/ai/runPrompt';
import {
  getFreeModelChain,
  inferTaskFromMessages,
  resolveOpenRouterTask,
} from '@/lib/ai/openRouterRouter';

function safeClientError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

function rateLimitedResponse(scope: 'ip' | 'user', retryAfterSec: number) {
  return NextResponse.json(
    { error: 'rate_limited', scope },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Scope': scope,
      },
    }
  );
}

export async function POST(request: NextRequest) {
  // Anonymous requests rejected here (requireAuthUserId) — cover with E2E later.
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  // Per-IP + per-user HTTP sliding windows (in-memory; Redis/KV needed multi-instance).
  const rate = enforceAiHttpRateLimits(getClientIp(request), userId);
  if (!rate.ok) {
    return rateLimitedResponse(rate.scope, rate.result.retryAfterSec);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return safeClientError(400, 'invalid_json');
  }

  const envProvider = resolveAiProvider(process.env.AI_PROVIDER);
  // When production uses OpenRouter, ignore client Anthropic/Claude hardcodes.
  if (envProvider === 'OPENROUTER') {
    body = { ...body, provider: 'OPENROUTER', model: body.model || 'auto' };
  }

  const validated = validateChatPayload(body as Parameters<typeof validateChatPayload>[0]);
  if (!validated.ok) {
    return safeClientError(validated.status, validated.code);
  }

  const usage = await checkAndIncrementAiUsage(request);
  if (usage.unauthorized) {
    return safeClientError(401, 'unauthorized');
  }
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: 'ai_limit_reached',
        usage: { plan: usage.plan, used: usage.used, limit: usage.limit },
      },
      { status: 402 }
    );
  }

  let { provider, model, messages, maxTokens, task: taskHint } = validated;
  const stream = Boolean(body.stream);
  const rawTemp = Number(
    (body.parameters as Record<string, unknown> | undefined)?.temperature ?? 0.7
  );
  const temperature = Number.isFinite(rawTemp) ? Math.min(2, Math.max(0, rawTemp)) : 0.7;

  const openRouterModels =
    provider === 'OPENROUTER'
      ? getFreeModelChain(
          resolveOpenRouterTask(taskHint ?? inferTaskFromMessages(messages)),
          process.env.AI_MODEL
        )
      : [model];

  if (provider === 'OPENROUTER') {
    model = openRouterModels[0];
  }

  try {
    const result =
      provider === 'OPENROUTER'
        ? await createCompletionWithFallbacks({
            provider,
            models: openRouterModels,
            messages,
            stream,
            parameters: { max_tokens: maxTokens, temperature },
          })
        : await createCompletion({
            provider,
            model,
            messages,
            stream,
            parameters: { max_tokens: maxTokens, temperature },
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
          } catch (streamError) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', error: getAiErrorCode(streamError) })}\n\n`
              )
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
    const code = getAiErrorCode(error);
    console.error('AI chat-completion failed', {
      userId,
      provider,
      model,
      code,
      message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
    });
    void logAiGeneration({
      userId,
      generationType: 'chat_completion',
      model: `${provider}/${model}`,
      success: false,
      error: code,
    });
    return safeClientError(code === 'rate_limited' ? 429 : 503, code);
  }
}
