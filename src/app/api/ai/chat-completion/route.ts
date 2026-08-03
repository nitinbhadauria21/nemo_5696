import { NextRequest, NextResponse } from 'next/server';
import { createCompletion } from '@/lib/ai/providers';
import { validateChatPayload } from '@/lib/ai/requestPolicy';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { requireAuthUserId } from '@/lib/api/auth';
import { getClientIp } from '@/lib/api/clientIp';
import { enforceAiHttpRateLimits } from '@/lib/ai/rateLimit';
import { trackEvent } from '@/lib/analytics/track';
import { logAiGeneration } from '@/lib/ai/logGeneration';

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
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', error: 'ai_unavailable' })}\n\n`
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
