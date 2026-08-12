import type { APIRequestContext } from '@playwright/test';

export type TrendsResponse = {
  trends: Array<{
    id: string;
    title: string;
    platforms?: string[];
    niches?: string[];
    firstDetectedAt?: string;
  }>;
  source: string;
  total: number;
  totalBeforeFilter?: number;
  lastIngestAt?: string;
  collectedAt?: string;
};

export async function fetchTrends(
  request: APIRequestContext,
  query: string
): Promise<TrendsResponse> {
  const res = await request.get(`/api/trends?${query}`);
  if (!res.ok()) {
    throw new Error(`GET /api/trends?${query} → ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<TrendsResponse>;
}

export function trendPlatformSet(body: TrendsResponse): Set<string> {
  const out = new Set<string>();
  for (const t of body.trends) {
    for (const p of t.platforms || []) out.add(p);
  }
  return out;
}
