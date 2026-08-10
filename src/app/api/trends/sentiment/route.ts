import { NextRequest, NextResponse } from 'next/server';
import { runAiPrompt } from '@/lib/ai/runPrompt';
import { getAiErrorCode } from '@/lib/ai/providers';
import { checkAndIncrementAiUsage } from '@/lib/billing/usage';
import { requireAuthUserId } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;
  void auth;

  const usage = await checkAndIncrementAiUsage(request);
  if (usage.unauthorized) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!usage.allowed) return NextResponse.json({ error: 'ai_limit_reached' }, { status: 402 });

  let body: { trendTitle?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body.trendTitle || body.trendTitle.length > 500) {
    return NextResponse.json({ error: 'invalid_trend_title' }, { status: 400 });
  }

  const prompt = `Brand safety and sentiment analysis for trend "${body.trendTitle}". Return JSON with keys: sentiment (positive|neutral|negative|mixed), brandSafety (safe|caution|risky), summary (2 sentences), risks (array of strings).`;

  try {
    const sentiment = await runAiPrompt(prompt, { task: 'sentiment' });
    return NextResponse.json({ sentiment });
  } catch (error) {
    return NextResponse.json({ error: getAiErrorCode(error) }, { status: 503 });
  }
}
