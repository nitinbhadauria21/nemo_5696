import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuthUserId } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { trackEvent } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 503 });
  }

  let body: { orderId?: string; paymentId?: string; signature?: string; mockSuccess?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Never allow mock upgrades
  if (body.mockSuccess) {
    return NextResponse.json({ error: 'mock_disabled' }, { status: 400 });
  }

  const { orderId, paymentId, signature } = body;
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  if (expected !== signature) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }

  const { data: order } = await admin
    .from('billing_orders')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }
  if (order.user_id !== userId) {
    return NextResponse.json({ error: 'order_forbidden' }, { status: 403 });
  }
  if (order.status === 'paid') {
    return NextResponse.json({ success: true, plan: order.plan, orderId, paymentId, idempotent: true });
  }
  if (order.status !== 'pending' && order.status !== 'created') {
    return NextResponse.json({ error: 'order_not_payable' }, { status: 409 });
  }

  // Confirm payment with Razorpay API
  try {
    const Razorpay = (await import('razorpay')).default;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret });
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId) {
      return NextResponse.json({ error: 'payment_order_mismatch' }, { status: 400 });
    }
    if (Number(payment.amount) !== Number(order.amount_paise)) {
      return NextResponse.json({ error: 'amount_mismatch' }, { status: 400 });
    }
    if (String(payment.currency).toUpperCase() !== String(order.currency).toUpperCase()) {
      return NextResponse.json({ error: 'currency_mismatch' }, { status: 400 });
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ error: 'payment_not_captured' }, { status: 400 });
    }
  } catch (e) {
    console.error('verify-payment fetch failed', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ error: 'payment_verify_failed' }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await admin
    .from('billing_orders')
    .update({
      status: 'paid',
      razorpay_payment_id: paymentId,
      paid_at: now,
      updated_at: now,
    })
    .eq('id', order.id)
    .in('status', ['pending', 'created'])
    .select('id, plan')
    .maybeSingle();

  if (updErr || !updated) {
    // Another path may have paid — re-read
    const { data: again } = await admin
      .from('billing_orders')
      .select('plan, status')
      .eq('id', order.id)
      .maybeSingle();
    if (again?.status === 'paid') {
      return NextResponse.json({ success: true, plan: again.plan, orderId, paymentId, idempotent: true });
    }
    return NextResponse.json({ error: 'order_update_failed' }, { status: 500 });
  }

  await admin
    .from('profiles')
    .update({ plan: order.plan, updated_at: now })
    .eq('id', userId);

  await trackEvent({
    userId,
    eventName: 'billing.verify_payment',
    eventCategory: 'billing',
    properties: { plan: order.plan, order_id: order.id, payment_id: paymentId },
    request,
  });

  // Do NOT set nemo_plan cookie — plan authority is profiles.plan only
  return NextResponse.json({
    success: true,
    plan: order.plan,
    orderId,
    paymentId,
  });
}
