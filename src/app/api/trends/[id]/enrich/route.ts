import { NextRequest, NextResponse } from 'next/server';
import { enrichTrendOnDemand, type EnrichKind } from '@/lib/trends/enrichOnDemand';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  let kind: EnrichKind = 'all';
  try {
    const body = (await request.json()) as { kind?: string };
    if (body.kind === 'geo' || body.kind === 'sources' || body.kind === 'all') {
      kind = body.kind;
    }
  } catch {
    kind = 'all';
  }

  const result = await enrichTrendOnDemand(id, kind);
  return NextResponse.json(result);
}
