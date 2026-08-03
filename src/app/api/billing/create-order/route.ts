import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { trackEvent } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan = 'pro', billing = 'monthly', amountInr } = body;
    const userId = await getAuthUserId();

    if (!amountInr || amountInr < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const razorpayEnabled = Boolean(keyId && keySecret);

    if (!razorpayEnabled) {
      await trackEvent({
        userId,
        eventName: 'billing.create_order',
        eventCategory: 'billing',
        properties: { plan, billing, amount_inr: amountInr, razorpay: false },
        request,
      });
      return NextResponse.json(
        {
          error: 'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
          razorpayEnabled: false,
        },
        { status: 503 }
      );
    }

    const receipt = `nemo_${Date.now()}_${plan}`.slice(0, 40);
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret! });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amountInr) * 100),
      currency: 'INR',
      receipt,
      notes: { plan, billing, user_id: userId ?? '' },
    });

    await trackEvent({
      userId,
      eventName: 'billing.create_order',
      eventCategory: 'billing',
      properties: { plan, billing, amount_inr: amountInr, razorpay: true },
      request,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayEnabled: true,
      keyId,
      plan,
      billing,
    });
  } catch (error) {
    console.error('create-order error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
