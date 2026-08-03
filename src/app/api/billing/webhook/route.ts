import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { trackEvent } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const body = await request.text();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }
  } else {
    const signature = request.headers.get('x-razorpay-signature');
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const paymentEntity = (payload?.payload as { payment?: { entity?: Record<string, unknown> } })
    ?.payment?.entity;
  const notes = (paymentEntity?.notes || {}) as Record<string, string>;
  const plan = notes.plan === 'agency' ? 'agency' : notes.plan === 'pro' ? 'pro' : 'pro';
  const userId = typeof notes.user_id === 'string' ? notes.user_id : null;

  if (isSupabaseConfigured() && userId) {
    const admin = createAdminClient();
    if (admin) {
      await admin
        .from('profiles')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  }

  await trackEvent({
    userId,
    eventName: 'billing.webhook',
    eventCategory: 'billing',
    properties: { plan, event: (payload as { event?: string })?.event ?? null },
    request,
  });

  return NextResponse.json({ received: true });
}
