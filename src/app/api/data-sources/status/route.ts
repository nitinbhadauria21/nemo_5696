import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { collectProviderHealth } from '@/lib/providers';

export async function GET() {
  const providers = await collectProviderHealth();

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.from('data_source_status').select('*');
      if (data?.length) {
        const byPlatform = new Map(data.map((r) => [r.platform, r]));
        const sources = providers.map((p) => {
          const row = byPlatform.get(p.platform);
          return {
            platform: p.platform,
            displayName: p.displayName,
            status: row?.enabled === false ? 'disabled' : row?.status || p.status,
            metricMode: row?.metric_mode || p.metricMode,
            notes: row?.notes || p.notes,
            enabled: row?.enabled ?? true,
            pollIntervalMinutes: row?.poll_interval_minutes ?? 30,
            lastSuccessAt: row?.last_success_at ?? null,
            lastError: row?.last_error ?? null,
            recordsLastRun: row?.records_last_run ?? 0,
          };
        });
        const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
        return NextResponse.json({ sources, demo });
      }
    }
  } catch {
    // fall through to in-memory provider health
  }

  return NextResponse.json({
    sources: providers.map((p) => ({
      platform: p.platform,
      displayName: p.displayName,
      status: p.status,
      metricMode: p.metricMode,
      notes: p.notes,
      enabled: true,
      pollIntervalMinutes: 30,
      lastSuccessAt: null,
      lastError: null,
      recordsLastRun: 0,
    })),
    demo: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  });
}
