import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const ADMIN_CODE = process.env.ADMIN_MASTER_CODE?.trim();
  if (!ADMIN_CODE || ADMIN_CODE.length < 12) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_MASTER_CODE in the environment.' },
      { status: 503 }
    );
  }

  const { code } = await request.json();
  if (!code || code !== ADMIN_CODE) {
    return NextResponse.json({ error: 'Invalid admin code' }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set('nemo_admin_session', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
  return NextResponse.json({ ok: true });
}
