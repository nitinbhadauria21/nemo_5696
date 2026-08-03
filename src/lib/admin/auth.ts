import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAdminSession(): Promise<true | NextResponse> {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return true;
}

export function isAdminCookie(requestCookies: {
  get: (name: string) => { value: string } | undefined;
}) {
  return Boolean(requestCookies.get('nemo_admin_session')?.value);
}
