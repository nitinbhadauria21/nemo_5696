import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin/auth';

export async function GET() {
  const adminAuth = await requireAdminSession();
  const ok = adminAuth === true;
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}
