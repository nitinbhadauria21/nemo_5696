import { NextRequest, NextResponse } from 'next/server';
import { runAiPrompt } from '@/lib/ai/runPrompt';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';

export async function POST(request: NextRequest) {
  const usage = await checkAndIncrementAiUsage(request);
  if (!usage.allowed) {
    return NextResponse.json({ error: 'AI limit reached' }, { status: 429 });
  }

  const { trendTitle } = await request.json();
  if (!trendTitle) {
    return NextResponse.json({ error: 'trendTitle required' }, { status: 400 });
  }

  const prompt = `Brand safety and sentiment analysis for trend "${trendTitle}". Return JSON with keys: sentiment (positive|neutral|negative|mixed), brandSafety (safe|caution|risky), summary (2 sentences), risks (array of strings).`;

  try {
    const sentiment = await runAiPrompt(prompt);
    return NextResponse.json({ sentiment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI unavailable' },
      { status: 503 }
    );
  }
}
