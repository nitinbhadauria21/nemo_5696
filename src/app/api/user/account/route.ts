import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUserId } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * DELETE /api/user/account
 * Permanently deletes the authenticated user's auth.users row.
 * Cascades to profiles and owned product tables (ON DELETE CASCADE).
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuthUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const body = await request.json().catch(() => ({}));
  const confirm = typeof body.confirm === 'string' ? body.confirm.trim() : '';
  if (confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'confirmation_required', hint: 'Send { "confirm": "DELETE" }' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 503 });
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: userId });
}
