import { NextRequest, NextResponse } from 'next/server';
import { runAiPrompt } from '@/lib/ai/runPrompt';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { requireAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';
import { logAiGeneration } from '@/lib/ai/logGeneration';

export async function POST(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;

  const usage = await checkAndIncrementAiUsage(request);
  if (usage.unauthorized) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!usage.allowed) return NextResponse.json({ error: 'ai_limit_reached' }, { status: 402 });

  let body: { trendTitle?: string; platform?: string; trendId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.trendTitle || body.trendTitle.length > 500) {
    return NextResponse.json({ error: 'invalid_trend_title' }, { status: 400 });
  }

  const prompt = `Generate 5 viral content ideas for the trend "${body.trendTitle}"${body.platform ? ` on ${String(body.platform).slice(0, 40)}` : ''}. For each: hook, format (reel/short/post), and CTA. Numbered list.`;

  try {
    const ideas = await runAiPrompt(prompt);
    await trackEvent({
      userId: auth,
      eventName: 'ai.generate_ideas',
      eventCategory: 'ai',
      properties: { plan: usage.plan },
      request,
    });
    await logAiGeneration({
      userId: auth,
      generationType: 'generate_ideas',
      trendId: body.trendId ?? null,
      success: true,
    });
    return NextResponse.json({ ideas });
  } catch {
    await logAiGeneration({
      userId: auth,
      generationType: 'generate_ideas',
      trendId: body.trendId ?? null,
      success: false,
      error: 'ai_unavailable',
    });
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 });
  }
}
