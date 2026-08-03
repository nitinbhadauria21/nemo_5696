import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { trackEvent } from '@/lib/analytics/track';
import {
  RAZORPAY_DOWNGRADE_EVENTS,
  RAZORPAY_SUCCESS_EVENTS,
  verifyRazorpaySignature,
} from '@/lib/billing/webhookSignature';

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const body = await request.text();

  if (!secret) {
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('x-razorpay-signature');
  if (!verifyRazorpaySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let payload: {
    event?: string;
    id?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      order?: { entity?: Record<string, unknown> };
      refund?: { entity?: Record<string, unknown> };
    };
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const eventType = String(payload.event || '');
  const eventId = String(payload.id || `${eventType}:${Date.now()}`);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true, skipped: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }

  // Idempotency
  const { error: dedupeErr } = await admin.from('billing_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    payload: payload as unknown as Record<string, unknown>,
  });
  if (dedupeErr) {
    // Unique violation → already processed
    if (dedupeErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('webhook dedupe insert failed', dedupeErr.message);
  }

  const paymentEntity = payload.payload?.payment?.entity;
  const notes = (paymentEntity?.notes || {}) as Record<string, string>;
  const razorpayOrderId =
    (typeof paymentEntity?.order_id === 'string' && paymentEntity.order_id) ||
    (typeof payload.payload?.order?.entity?.id === 'string' &&
      (payload.payload.order.entity.id as string)) ||
    null;
  const paymentId = typeof paymentEntity?.id === 'string' ? paymentEntity.id : null;
  const internalOrderId = notes.internal_order_id || null;

  let orderQuery = admin.from('billing_orders').select('*');
  if (internalOrderId) {
    orderQuery = orderQuery.eq('id', internalOrderId);
  } else if (razorpayOrderId) {
    orderQuery = orderQuery.eq('razorpay_order_id', razorpayOrderId);
  } else {
    await trackEvent({
      userId: null,
      eventName: 'billing.webhook',
      eventCategory: 'billing',
      properties: { event: eventType, ignored: true },
      request,
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  const { data: order } = await orderQuery.maybeSingle();
  if (!order) {
    return NextResponse.json({ received: true, order_missing: true });
  }

  const now = new Date().toISOString();

  if (RAZORPAY_SUCCESS_EVENTS.has(eventType)) {
    if (order.status !== 'paid') {
      await admin
        .from('billing_orders')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId || order.razorpay_payment_id,
          paid_at: now,
          updated_at: now,
        })
        .eq('id', order.id)
        .neq('status', 'paid');

      await admin
        .from('profiles')
        .update({ plan: order.plan, updated_at: now })
        .eq('id', order.user_id);
    }
  } else if (RAZORPAY_DOWNGRADE_EVENTS.has(eventType)) {
    if (eventType.startsWith('refund')) {
      await admin
        .from('billing_orders')
        .update({ status: 'refunded', updated_at: now })
        .eq('id', order.id);
      await admin
        .from('profiles')
        .update({ plan: 'free', updated_at: now })
        .eq('id', order.user_id);
    } else {
      await admin
        .from('billing_orders')
        .update({ status: 'failed', updated_at: now })
        .eq('id', order.id)
        .neq('status', 'paid');
    }
  }

  await trackEvent({
    userId: order.user_id,
    eventName: 'billing.webhook',
    eventCategory: 'billing',
    properties: { plan: order.plan, event: eventType, order_id: order.id },
    request,
  });

  return NextResponse.json({ received: true });
}
