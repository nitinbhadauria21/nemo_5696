import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET() {
  const cookieStore = await cookies();
  if (!cookieStore.get('nemo_admin_session')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks: { id: string; name: string; status: string; detail: string }[] = [];

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const t0 = Date.now();
      const { error } = await admin.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
      const latency = Date.now() - t0;
      checks.push({
        id: 'supabase',
        name: 'Supabase',
        status: error ? 'down' : 'operational',
        detail: error ? error.message : `${latency}ms`,
      });
    } else {
      checks.push({
        id: 'supabase',
        name: 'Supabase',
        status: 'down',
        detail: 'Admin client missing service role',
      });
    }
  } else {
    checks.push({
      id: 'supabase',
      name: 'Supabase',
      status: 'degraded',
      detail: 'Not configured',
    });
  }

  const youtube = Boolean(process.env.YOUTUBE_API_KEY);
  const googleProxy = Boolean(process.env.GOOGLE_TRENDS_PROXY_URL);
  const cron = Boolean(process.env.CRON_SECRET);

  checks.push({
    id: 'reddit',
    name: 'Reddit collector',
    status: 'operational',
    detail: 'Public JSON',
  });
  checks.push({
    id: 'youtube',
    name: 'YouTube collector',
    status: youtube ? 'operational' : 'degraded',
    detail: youtube ? 'API key set' : 'Missing YOUTUBE_API_KEY',
  });
  checks.push({
    id: 'google',
    name: 'Google Trends',
    status: googleProxy ? 'operational' : 'degraded',
    detail: googleProxy ? 'Proxy configured' : 'Seeds / no proxy',
  });
  checks.push({
    id: 'cron',
    name: 'Cron secret',
    status: cron ? 'operational' : 'degraded',
    detail: cron ? 'CRON_SECRET set' : 'Unset — protect /api/trends',
  });
  checks.push({
    id: 'api',
    name: 'Admin API',
    status: 'operational',
    detail: 'Session OK',
  });

  return NextResponse.json({ checks, checkedAt: new Date().toISOString() });
}
