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
import { inferTaskFromMessages, selectOpenRouterRoute } from '@/lib/ai/openRouterRouter';

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

type ScriptMeta = {
  topic?: string;
  audienceType?: string;
  customAudience?: string;
  duration?: string;
  scenesCount?: number;
  language?: string;
  mode?: string;
};

function parseScriptMeta(raw: unknown): ScriptMeta | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    topic: typeof o.topic === 'string' ? o.topic.slice(0, 300) : undefined,
    audienceType: typeof o.audienceType === 'string' ? o.audienceType.slice(0, 80) : undefined,
    customAudience:
      typeof o.customAudience === 'string' ? o.customAudience.slice(0, 120) : undefined,
    duration: typeof o.duration === 'string' ? o.duration.slice(0, 20) : undefined,
    scenesCount: typeof o.scenesCount === 'number' ? o.scenesCount : undefined,
    language: typeof o.language === 'string' ? o.language.slice(0, 40) : undefined,
    mode: typeof o.mode === 'string' ? o.mode.slice(0, 20) : undefined,
  };
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

  const { provider, messages, maxTokens, task: taskHint } = validated;
  let { model } = validated;
  const stream = Boolean(body.stream);
  const rawTemp = Number(
    (body.parameters as Record<string, unknown> | undefined)?.temperature ?? 0.7
  );
  const temperature = Number.isFinite(rawTemp) ? Math.min(2, Math.max(0, rawTemp)) : 0.7;
  const scriptMeta = parseScriptMeta(body.scriptMeta ?? body.script_meta);
  const startedAt = Date.now();

  const openRouterRoute =
    provider === 'OPENROUTER'
      ? selectOpenRouterRoute(taskHint ?? inferTaskFromMessages(messages), process.env.AI_MODEL)
      : null;
  const openRouterModels = openRouterRoute?.models ?? [model];
  const taskName = openRouterRoute?.task ?? taskHint ?? 'chat';

  if (provider === 'OPENROUTER' && openRouterRoute) {
    model = openRouterRoute.primary;
    console.info('[openrouter-agent]', {
      task: openRouterRoute.task,
      primary: openRouterRoute.primary,
      models: openRouterRoute.models,
      strategy: openRouterRoute.strategy,
      reason: openRouterRoute.reason,
    });
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

    const latencyMs = Date.now() - startedAt;
    const modelUsed = `${provider}/${model}`;
    const attemptCount = openRouterModels.length;

    void trackEvent({
      userId,
      eventName: 'ai.chat_completion',
      eventCategory: 'ai',
      properties: {
        provider,
        model,
        stream,
        plan: usage.plan,
        task: taskName,
        routeStrategy: openRouterRoute?.strategy,
        latency_ms: latencyMs,
        ...(scriptMeta ? { scriptMeta } : {}),
      },
      request,
    });
    void logAiGeneration({
      userId,
      generationType: taskName === 'script' ? 'script' : 'chat_completion',
      model: modelUsed,
      modelUsed,
      success: true,
      latencyMs,
      task: taskName,
      status: 'ok',
      attemptCount,
      properties: {
        stream,
        plan: usage.plan,
        task: taskName,
        models: openRouterModels,
        fallback: attemptCount > 1,
        ...(scriptMeta ? { scriptMeta } : {}),
      },
    });

    // scriptMeta is logged on ai_generations/events; client POSTs script_generations after parse.

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
    const latencyMs = Date.now() - startedAt;
    console.error('AI chat-completion failed', {
      userId,
      provider,
      model,
      code,
      message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
    });
    void logAiGeneration({
      userId,
      generationType: taskName === 'script' ? 'script' : 'chat_completion',
      model: `${provider}/${model}`,
      modelUsed: `${provider}/${model}`,
      success: false,
      error: code,
      latencyMs,
      task: taskName,
      status: code,
      attemptCount: openRouterModels.length,
      properties: scriptMeta ? { scriptMeta } : {},
    });
    return safeClientError(code === 'rate_limited' ? 429 : 503, code);
  }
}
