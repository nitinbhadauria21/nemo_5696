import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from('trend_sources')
        .select('*')
        .eq('trend_id', id)
        .order('collected_at', { ascending: false })
        .limit(50);
      if (data) {
        return NextResponse.json({ sources: data });
      }
    }
  } catch {
    // empty
  }
  return NextResponse.json({ sources: [] });
}
