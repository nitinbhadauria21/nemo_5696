import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { collectProviderHealth } from '@/lib/providers';
import { userFacingPlatformStatus } from '@/lib/trends/publicCopy';
import type { ProviderHealthStatus } from '@/lib/providers/types';

function reconcileStatus(
  platform: string,
  providerStatus: string,
  row?: Record<string, unknown>
): string {
  if (row?.enabled === false) return 'disabled';
  const records = Number(row?.records_last_run ?? 0);
  const fromDb = row?.status ? String(row.status) : '';

  if (platform === 'linkedin') return 'unavailable';

  // Prefer last-run truth: never show Live when last ingest returned 0 rows
  if (fromDb) {
    if (records <= 0 && (fromDb === 'active' || fromDb === 'live')) {
      return platform === 'twitter' ? 'estimated' : 'unavailable';
    }
    return fromDb;
  }

  if (records > 0) {
    if (platform === 'twitter') return 'partial';
    if (providerStatus === 'partial' || providerStatus === 'estimated') return providerStatus;
    return 'active';
  }

  // No DB row / no records this run
  if (providerStatus === 'unavailable' || providerStatus === 'error') return 'unavailable';
  if (platform === 'twitter') return 'estimated';
  if (providerStatus === 'partial' || providerStatus === 'estimated') return 'partial';
  // Key may be present but no successful records yet
  return 'unavailable';
}

export async function GET() {
  const providers = await collectProviderHealth();

  const mapSource = (
    p: {
      platform: string;
      displayName: string;
      status: string;
      metricMode?: string;
    },
    row?: Record<string, unknown>
  ) => {
    const status = reconcileStatus(p.platform, p.status, row) as ProviderHealthStatus;
    return {
      platform: p.platform,
      displayName: p.displayName,
      status,
      label: userFacingPlatformStatus(status),
      enabled: row?.enabled ?? true,
      lastSuccessAt: row?.last_success_at ?? null,
      recordsLastRun: Number(row?.records_last_run ?? 0),
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
