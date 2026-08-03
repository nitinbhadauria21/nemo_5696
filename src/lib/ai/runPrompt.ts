import { createCompletion, type ProviderId } from '@/lib/ai/providers';

function extractText(result: unknown): string {
  if (!result || typeof result !== 'object') return String(result ?? '');
  const r = result as Record<string, unknown>;
  if (typeof r.content === 'string') return r.content;
  if (Array.isArray(r.content)) {
    return r.content
      .map((block) =>
        typeof block === 'object' && block && 'text' in block
          ? String((block as { text: string }).text)
          : ''
      )
      .join('\n');
  }
  if (r.choices && Array.isArray(r.choices)) {
    const choice = r.choices[0] as { message?: { content?: string } };
    return choice?.message?.content ?? '';
  }
  return JSON.stringify(result);
}

export async function runAiPrompt(prompt: string): Promise<string> {
  const provider = (process.env.AI_PROVIDER as ProviderId) || 'ANTHROPIC';
  const model =
    process.env.AI_MODEL || (provider === 'ANTHROPIC' ? 'claude-sonnet-4-20250514' : 'gpt-4o-mini');

  const result = await createCompletion({
    provider,
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return extractText(result);
}
