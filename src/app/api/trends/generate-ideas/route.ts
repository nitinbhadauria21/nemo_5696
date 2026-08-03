import { NextRequest, NextResponse } from 'next/server';
import { runAiPrompt } from '@/lib/ai/runPrompt';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';
import { logAiGeneration } from '@/lib/ai/logGeneration';

export async function POST(request: NextRequest) {
  const usage = await checkAndIncrementAiUsage(request);
  if (!usage.allowed) {
    return NextResponse.json({ error: 'AI limit reached' }, { status: 429 });
  }

  const { trendTitle, platform, trendId } = await request.json();
  if (!trendTitle) {
    return NextResponse.json({ error: 'trendTitle required' }, { status: 400 });
  }

  const prompt = `Generate 5 viral content ideas for the trend "${trendTitle}"${platform ? ` on ${platform}` : ''}. For each: hook, format (reel/short/post), and CTA. Numbered list.`;
  const userId = await getAuthUserId();

  try {
    const ideas = await runAiPrompt(prompt);
    await trackEvent({
      userId,
      eventName: 'ai.generate_ideas',
      eventCategory: 'ai',
      properties: { trend_title: trendTitle, platform: platform ?? null, plan: usage.plan },
      request,
    });
    await logAiGeneration({
      userId,
      generationType: 'generate_ideas',
      trendId: trendId ?? null,
      success: true,
      properties: { trend_title: trendTitle, platform: platform ?? null },
    });
    return NextResponse.json({ ideas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI unavailable';
    await logAiGeneration({
      userId,
      generationType: 'generate_ideas',
      trendId: trendId ?? null,
      success: false,
      error: msg,
      properties: { trend_title: trendTitle },
    });
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
