import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_CODE = process.env.ADMIN_MASTER_CODE || 'NEMO_MASTER_2026_NITIN';

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  if (code !== ADMIN_CODE) {
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
