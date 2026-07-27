import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthUserId } from '@/lib/api/auth';
import { createHash, randomBytes } from 'crypto';
import { trackEvent } from '@/lib/analytics/track';

const memoryKeys = new Map<string, Array<{ id: string; name: string; key_prefix: string; created_at: string }>>();

export async function GET() {
  const userId = (await getAuthUserId()) || 'demo';
  if (isSupabaseConfigured() && userId !== 'demo') {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ keys: memoryKeys.get(userId) ?? [] });
    const { data } = await supabase.from('api_keys').select('id, name, key_prefix, created_at, last_used_at').eq('user_id', userId);
    return NextResponse.json({ keys: data ?? [] });
  }
  return NextResponse.json({ keys: memoryKeys.get(userId) ?? [] });
}

export async function POST(request: NextRequest) {
  const userId = (await getAuthUserId()) || 'demo';
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const rawKey = `nemo_${randomBytes(24).toString('hex')}`;
  const key_prefix = rawKey.slice(0, 12);
  const key_hash = createHash('sha256').update(rawKey).digest('hex');

  if (isSupabaseConfigured() && userId !== 'demo') {
    const supabase = await createClient();
    if (!supabase) {
      const entry = { id: crypto.randomUUID(), name, key_prefix, created_at: new Date().toISOString() };
      const list = memoryKeys.get(userId) ?? [];
      list.push(entry);
      memoryKeys.set(userId, list);
      return NextResponse.json({ key: entry, secret: rawKey });
    }
    const { data, error } = await supabase
      .from('api_keys')
      .insert({ user_id: userId, name, key_prefix, key_hash })
      .select('id, name, key_prefix, created_at')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await trackEvent({
      userId,
      eventName: 'api_key.create',
      eventCategory: 'api_key',
      properties: { name, key_prefix },
      request,
    });
    return NextResponse.json({ key: data, secret: rawKey });
  }

  const entry = { id: crypto.randomUUID(), name, key_prefix, created_at: new Date().toISOString() };
  const list = memoryKeys.get(userId) ?? [];
  list.push(entry);
  memoryKeys.set(userId, list);
  return NextResponse.json({ key: entry, secret: rawKey });
}
