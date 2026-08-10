import { NextRequest, NextResponse } from 'next/server';
import { runAiPrompt } from '@/lib/ai/runPrompt';
import { getAiErrorCode } from '@/lib/ai/providers';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { requireAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';
import { logAiGeneration } from '@/lib/ai/logGeneration';

export async function POST(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;

  const usage = await checkAndIncrementAiUsage(request);
  if (usage.unauthorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!usage.allowed) {
    return NextResponse.json({ error: 'ai_limit_reached' }, { status: 402 });
  }

  let body: { trendTitle?: string; trendDescription?: string; trendId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const { trendTitle, trendDescription, trendId } = body;
  if (!trendTitle || typeof trendTitle !== 'string' || trendTitle.length > 500) {
    return NextResponse.json({ error: 'invalid_trend_title' }, { status: 400 });
  }

  const prompt = `Analyze why "${trendTitle}" is trending${trendDescription ? `: ${String(trendDescription).slice(0, 1000)}` : ''}. Provide: 1) Why it's trending (3 bullets), 2) Predicted trajectory (next 48-72h), 3) Best platforms to act on. Be concise.`;

  const startedAt = Date.now();
  try {
    const analysis = await runAiPrompt(prompt, { task: 'analysis' });
    const latencyMs = Date.now() - startedAt;
    await trackEvent({
      userId: auth,
      eventName: 'ai.analyze',
      eventCategory: 'ai',
      properties: { plan: usage.plan, latency_ms: latencyMs },
      request,
    });
    await logAiGeneration({
      userId: auth,
      generationType: 'analyze',
      task: 'analysis',
      trendId: trendId ?? null,
      success: true,
      latencyMs,
      status: 'ok',
    });
    return NextResponse.json({ analysis });
  } catch (error) {
    const code = getAiErrorCode(error);
    await logAiGeneration({
      userId: auth,
      generationType: 'analyze',
      task: 'analysis',
      trendId: trendId ?? null,
      success: false,
      error: code,
      latencyMs: Date.now() - startedAt,
      status: code,
    });
    return NextResponse.json({ error: code }, { status: 503 });
  }
}
