import { NextRequest, NextResponse } from 'next/server';
import { runAiPrompt } from '@/lib/ai/runPrompt';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  const usage = await checkAndIncrementAiUsage(request);
  if (!usage.allowed) {
    return NextResponse.json({ error: 'AI limit reached' }, { status: 429 });
  }

  const body = await request.json();
  const { trendTitle, trendDescription } = body as { trendTitle?: string; trendDescription?: string };
  if (!trendTitle) {
    return NextResponse.json({ error: 'trendTitle required' }, { status: 400 });
  }

  const prompt = `Analyze why "${trendTitle}" is trending${trendDescription ? `: ${trendDescription}` : ''}. Provide: 1) Why it's trending (3 bullets), 2) Predicted trajectory (next 48-72h), 3) Best platforms to act on. Be concise.`;

  try {
    const analysis = await runAiPrompt(prompt);
    const userId = await getAuthUserId();
    await trackEvent({
      userId,
      eventName: 'ai.analyze',
      eventCategory: 'ai',
      properties: { trend_title: trendTitle, plan: usage.plan },
      request,
    });
    return NextResponse.json({ analysis });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI unavailable' },
      { status: 503 }
    );
  }
}
