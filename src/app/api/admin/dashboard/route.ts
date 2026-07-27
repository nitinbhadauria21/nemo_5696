import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET() {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const [{ count: totalUsers }, { count: proUsers }, { count: agencyUsers }, { count: trendsToday }] =
        await Promise.all([
          admin.from('profiles').select('*', { count: 'exact', head: true }),
          admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
          admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'agency'),
          admin.from('trend_records').select('*', { count: 'exact', head: true }),
        ]);

      const { data: users } = await admin
        .from('profiles')
        .select('id, email, full_name, plan, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      return NextResponse.json({
        stats: {
          totalUsers: totalUsers ?? 0,
          proUsers: proUsers ?? 0,
          agencyUsers: agencyUsers ?? 0,
          trendsToday: trendsToday ?? 0,
          aiCalls24h: 0,
        },
        users: users ?? [],
        source: 'supabase',
      });
    }
  }

  return NextResponse.json({
    stats: {
      totalUsers: MOCK_ADMIN_USERS.length,
      proUsers: MOCK_ADMIN_USERS.filter((u) => u.plan === 'Pro').length,
      agencyUsers: MOCK_ADMIN_USERS.filter((u) => u.plan === 'Agency').length,
      trendsToday: 2847,
      aiCalls24h: 12400,
    },
    users: MOCK_ADMIN_USERS,
    source: 'mock',
  });
}
