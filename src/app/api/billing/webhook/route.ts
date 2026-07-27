import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { trackEvent } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const body = await request.text();

  if (secret) {
    const signature = request.headers.get('x-razorpay-signature');
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  const payload = JSON.parse(body);
  const plan = payload?.payload?.payment?.entity?.notes?.plan || 'pro';
  const userId = payload?.payload?.payment?.entity?.notes?.user_id;
  const cookieStore = await cookies();
  cookieStore.set('nemo_plan', plan, { path: '/', maxAge: 60 * 60 * 24 * 365 });

  if (isSupabaseConfigured() && userId) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.from('profiles').update({ plan, updated_at: new Date().toISOString() }).eq('id', userId);
    }
  }

  await trackEvent({
    userId: typeof userId === 'string' ? userId : null,
    eventName: 'billing.webhook',
    eventCategory: 'billing',
    properties: { plan, event: payload?.event ?? null },
    request,
  });

  return NextResponse.json({ received: true });
}
