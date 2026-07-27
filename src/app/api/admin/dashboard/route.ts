import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';

export async function GET() {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  });
}
