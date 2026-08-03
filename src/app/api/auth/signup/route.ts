import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { trackEvent } from '@/lib/analytics/track';

/**
 * Creates a confirmed user via service role so local/MVP signup works
 * without waiting on email verification. Client should then signInWithPassword.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Server misconfigured — SUPABASE_SERVICE_ROLE_KEY required for signup' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Production: email confirmation required unless SUPABASE_AUTO_CONFIRM=true explicitly
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const autoConfirm = isProd
      ? process.env.SUPABASE_AUTO_CONFIRM === 'true'
      : process.env.SUPABASE_AUTO_CONFIRM !== 'false';

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: autoConfirm,
      user_metadata: { full_name: name },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already') || msg.includes('registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        );
      }
      if (msg.includes('invalid') && msg.includes('email')) {
        return NextResponse.json(
          { error: 'Please use a valid email address (e.g. you@gmail.com).' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Ensure profile row exists even if auth trigger is flaky with admin createUser
    if (data.user?.id) {
      await admin.from('profiles').upsert(
        {
          id: data.user.id,
          email,
          full_name: name || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      await trackEvent({
        userId: data.user.id,
        eventName: 'auth.signup',
        eventCategory: 'auth',
        properties: { email_confirmed: Boolean(data.user.email_confirmed_at) || autoConfirm },
        request,
      });
    }

    return NextResponse.json({
      ok: true,
      userId: data.user?.id,
      emailConfirmed: Boolean(data.user?.email_confirmed_at) || autoConfirm,
      needsVerification: !autoConfirm,
    });
  } catch (err) {
    console.error('signup error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Signup failed' },
      { status: 500 }
    );
  }
}
