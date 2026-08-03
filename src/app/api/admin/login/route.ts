import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUserId } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Admin bootstrap: only an already-authenticated user who matches ADMIN_EMAIL
 * (or already has is_admin) can enter the admin area.
 * Master-code cookie auth is removed.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('email, is_admin')
    .eq('id', userId)
    .maybeSingle();

  const email = (profile?.email || '').toLowerCase();
  const allowed =
    profile?.is_admin === true || (adminEmail && email && email === adminEmail);

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!profile?.is_admin && adminEmail && email === adminEmail) {
    await admin.from('profiles').update({ is_admin: true }).eq('id', userId);
  }

  // Optional UX cookie — NOT used for authorization
  const res = NextResponse.json({ ok: true });
  res.cookies.set('nemo_admin_session', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
  void request;
  return res;
}
