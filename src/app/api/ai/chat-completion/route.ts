import { NextRequest, NextResponse } from 'next/server';
import { createCompletion, type ChatMessage, type ProviderId } from '@/lib/ai/providers';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

function formatErrorResponse(error: unknown, provider?: string) {
  const statusCode = (error as { statusCode?: number; status?: number })?.statusCode
    || (error as { status?: number })?.status
    || 500;
  const providerName = (error as { llmProvider?: string })?.llmProvider || provider || 'Unknown';

  return {
    error: `${String(providerName).toUpperCase()} API error: ${statusCode}`,
    details: error instanceof Error ? error.message : String(error),
    statusCode,
  };
}

export async function POST(request: NextRequest) {
  let body: {
    provider?: ProviderId;
    model?: string;
    messages?: ChatMessage[];
    stream?: boolean;
    parameters?: Record<string, unknown>;
  } = {};

  try {
    body = await request.json();
    const { provider, model, messages, stream = false, parameters = {} } = body;

    if (!provider || !model || !messages?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, model, messages', details: 'Request validation failed' },
        { status: 400 }
      );
    }

    const usage = await checkAndIncrementAiUsage(request);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: 'AI usage limit reached',
          details: `Plan ${usage.plan} allows ${usage.limit} AI calls this period. Upgrade to continue.`,
          usage,
        },
        { status: 402 }
      );
    }

    const result = await createCompletion({
      provider,
      model,
      messages,
      stream,
      parameters,
    });

    const userId = await getAuthUserId();
    void trackEvent({
      userId,
      eventName: 'ai.chat_completion',
      eventCategory: 'ai',
      properties: { provider, model, stream: Boolean(stream), plan: usage.plan },
      request,
    });

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));

            for await (const chunk of result as AsyncIterable<unknown>) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`));
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          } catch (error) {
            const formatted = formatErrorResponse(error, provider);
            console.error('API Route Error:', { error: formatted.error, details: formatted.details });
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', error: formatted.error, details: formatted.details })}\n\n`
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
    const formatted = formatErrorResponse(error, body?.provider);
    console.error('API Route Error:', { error: formatted.error, details: formatted.details });
    return NextResponse.json(
      { error: formatted.error, details: formatted.details },
      { status: formatted.statusCode }
    );
  }
}
