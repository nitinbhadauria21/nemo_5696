import { NextRequest, NextResponse } from 'next/server';
import { getTrends } from '@/lib/trends/store';

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get('refresh') === '1';
  const result = await getTrends({ refresh });
  return NextResponse.json(result);
}

export async function POST() {
  const result = await getTrends({ refresh: true });
  return NextResponse.json(result);
}
