import { NextRequest, NextResponse } from 'next/server';
import { runAiPrompt } from '@/lib/ai/runPrompt';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';

export async function POST(request: NextRequest) {
  const usage = await checkAndIncrementAiUsage(request);
  if (!usage.allowed) {
    return NextResponse.json({ error: 'AI limit reached' }, { status: 429 });
  }

  const { trendTitle, platform } = await request.json();
  if (!trendTitle) {
    return NextResponse.json({ error: 'trendTitle required' }, { status: 400 });
  }

  const prompt = `Generate 5 viral content ideas for the trend "${trendTitle}"${platform ? ` on ${platform}` : ''}. For each: hook, format (reel/short/post), and CTA. Numbered list.`;

  try {
    const ideas = await runAiPrompt(prompt);
    return NextResponse.json({ ideas });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI unavailable' }, { status: 503 });
  }
}
