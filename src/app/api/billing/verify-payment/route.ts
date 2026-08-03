import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/analytics/track';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, plan = 'pro', mockSuccess } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const razorpayConfigured = Boolean(keySecret);
    const isProd = process.env.NODE_ENV === 'production';

    if (mockSuccess && (razorpayConfigured || isProd)) {
      return NextResponse.json(
        { error: 'Mock payments are disabled. Configure Razorpay to upgrade.' },
        { status: 400 }
      );
    }

    if (razorpayConfigured) {
      if (!orderId || !paymentId || !signature) {
        return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
      }
      const expected = crypto
        .createHmac('sha256', keySecret!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      if (expected !== signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    } else if (!mockSuccess) {
      return NextResponse.json(
        { error: 'Payments are not configured.' },
        { status: 503 }
      );
    }

    const resolvedPlan = plan === 'agency' ? 'agency' : 'pro';
    let userId: string | null = null;

    try {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          await supabase
            .from('profiles')
            .update({ plan: resolvedPlan, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      }
    } catch {
      // local cookie fallback
    }

    await trackEvent({
      userId,
      eventName: 'billing.verify_payment',
      eventCategory: 'billing',
      properties: { plan: resolvedPlan, mock: Boolean(mockSuccess) && !isProd },
      request,
    });

    const response = NextResponse.json({
      success: true,
      plan: resolvedPlan,
      orderId,
      paymentId: paymentId || null,
    });
    response.cookies.set('nemo_plan', resolvedPlan, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error('verify-payment error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
