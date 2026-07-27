import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';

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

    const orderId = `order_${Date.now()}_${plan}`;

    if (razorpayEnabled) {
      const Razorpay = (await import('razorpay')).default;
      const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret! });
      const order = await razorpay.orders.create({
        amount: Math.round(Number(amountInr) * 100),
        currency: 'INR',
        receipt: orderId,
        notes: { plan, billing, user_id: userId ?? '' },
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
    }

    return NextResponse.json({
      orderId,
      amount: Math.round(Number(amountInr) * 100),
      currency: 'INR',
      razorpayEnabled: false,
      plan,
      billing,
      paymentId: `pay_mock_${Date.now()}`,
    });
  } catch (error) {
    console.error('create-order error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
