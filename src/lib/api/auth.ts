import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { NextResponse } from 'next/server';

export async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function requireAuthUserId(): Promise<string | NextResponse> {
  const id = await getAuthUserId();
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return id;
}
