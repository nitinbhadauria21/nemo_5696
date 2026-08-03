import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUserId } from '@/lib/api/auth';
import { resolveSku } from '@/lib/billing/catalogue';
import { createAdminClient } from '@/lib/supabase/admin';
import { trackEvent } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  let body: { plan?: string; billing?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const catalogue = resolveSku(String(body.plan || ''), String(body.billing || 'monthly'));
  if (!catalogue) {
    return NextResponse.json({ error: 'invalid_sku' }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'payments_not_configured', razorpayEnabled: false },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }

  const amountPaise = catalogue.amountInr * 100;
  const { data: orderRow, error: insertError } = await admin
    .from('billing_orders')
    .insert({
      user_id: userId,
      sku: catalogue.sku,
      plan: catalogue.plan,
      billing_interval: catalogue.billing,
      amount_paise: amountPaise,
      currency: 'INR',
      status: 'created',
    })
    .select('id')
    .single();

  if (insertError || !orderRow) {
    console.error('billing_orders insert failed', insertError?.message);
    return NextResponse.json({ error: 'order_create_failed' }, { status: 500 });
  }

  try {
    const receipt = `nemo_${orderRow.id.replace(/-/g, '').slice(0, 32)}`;
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        plan: catalogue.plan,
        billing: catalogue.billing,
        sku: catalogue.sku,
        user_id: userId,
        internal_order_id: orderRow.id,
      },
    });

    await admin
      .from('billing_orders')
      .update({
        razorpay_order_id: order.id,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderRow.id);

    await trackEvent({
      userId,
      eventName: 'billing.create_order',
      eventCategory: 'billing',
      properties: {
        plan: catalogue.plan,
        billing: catalogue.billing,
        amount_inr: catalogue.amountInr,
        internal_order_id: orderRow.id,
      },
      request,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayEnabled: true,
      keyId,
      plan: catalogue.plan,
      billing: catalogue.billing,
      sku: catalogue.sku,
      amountInr: catalogue.amountInr,
      internalOrderId: orderRow.id,
    });
  } catch (error) {
    console.error('create-order razorpay error', error instanceof Error ? error.message : 'unknown');
    await admin
      .from('billing_orders')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', orderRow.id);
    return NextResponse.json({ error: 'order_create_failed' }, { status: 500 });
  }
}
