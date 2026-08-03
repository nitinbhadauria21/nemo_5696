import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin/auth';

/**
 * Legacy admin delete stub. Prefer profiles.status updates via /api/admin/users/[id].
 * Authorization uses is_admin — never the UX cookie.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;
  const { id } = await context.params;
  return NextResponse.json(
    { error: 'Use PATCH /api/admin/users/[id] to change status', id },
    { status: 405 }
  );
}
