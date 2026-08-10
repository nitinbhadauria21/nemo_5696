import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdminSession } from '@/lib/admin/auth';
import { randomBytes } from 'crypto';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Admin reset password — generates a temporary password, sets via Auth Admin API.
 * Temp password is returned ONCE in the response. NEVER persisted to any public table.
 */
export async function POST(_request: NextRequest, context: Ctx) {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      temporaryPassword: 'DemoTempPass123!',
      source: 'mock',
      note: 'Shown once only. Not stored in the database.',
    });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { data: profile } = await admin.from('profiles').select('id, email').eq('id', id).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const temporaryPassword = `Nemo-${randomBytes(6).toString('base64url')}!aA1`;

  const { error } = await admin.auth.admin.updateUserById(id, {
    password: temporaryPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: profile.email,
    temporaryPassword,
    note: 'Copy this password now — it will not be shown again and is not stored in the database.',
  });
}
