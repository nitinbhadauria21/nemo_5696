import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { collectProviderHealth } from '@/lib/providers';
import { userFacingPlatformStatus } from '@/lib/trends/publicCopy';

export async function GET() {
  const providers = await collectProviderHealth();

  const mapSource = (p: {
    platform: string;
    displayName: string;
    status: string;
    metricMode?: string;
  }, row?: Record<string, unknown>) => {
    const status = row?.enabled === false ? 'disabled' : String(row?.status || p.status);
    return {
      platform: p.platform,
      displayName: p.displayName,
      status,
      label: userFacingPlatformStatus(status),
      // Do not expose internal notes / vendor strings to the client
      enabled: row?.enabled ?? true,
      lastSuccessAt: row?.last_success_at ?? null,
      recordsLastRun: row?.records_last_run ?? 0,
    };
  };

  try {
    const admin = createAdminClient();
    const supabase = admin || (await createClient());
    if (supabase) {
      const { data } = await supabase.from('data_source_status').select('*');
      if (data?.length) {
        const byPlatform = new Map(data.map((r) => [r.platform, r]));
        const sources = providers.map((p) => mapSource(p, byPlatform.get(p.platform)));
        const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
        return NextResponse.json({ sources, demo });
      }
    }
  } catch {
    // fall through
  }

  return NextResponse.json({
    sources: providers.map((p) => mapSource(p)),
    demo: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  });
}
