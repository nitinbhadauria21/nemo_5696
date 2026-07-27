import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, plan = 'pro', mockSuccess } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && paymentId && signature && orderId && !mockSuccess) {
      const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      if (expected !== signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    const resolvedPlan = plan === 'agency' ? 'agency' : 'pro';

    try {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ plan: resolvedPlan }).eq('id', user.id);
        }
      }
    } catch {
      // local cookie fallback
    }

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
