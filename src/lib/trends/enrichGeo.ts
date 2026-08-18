import { untilRealResult } from '@/lib/loop/untilRealResult';
import {
  hasRealCountryMix,
  mergeGeoShares,
  parseInterestByRegion,
  type GeoShare,
} from './geoChart';

const GEO_MAP_TIMEOUT_MS = 12000;

export type GeoFetchOpts = {
  /** Prefer YouTube property when the trend is YouTube-native. */
  platform?: string | null;
};

function isYouTubePlatform(platform?: string | null): boolean {
  const p = String(platform || '').toLowerCase();
  return p === 'youtube' || p === 'youtube_shorts';
}

/** SerpAPI: single-query interest-by-region requires GEO_MAP_0 + region=COUNTRY. */
export function buildSerpInterestByRegionUrl(
  query: string,
  apiKey: string,
  opts?: { gprop?: 'youtube' | 'images' | 'news' | 'froogle' }
): string {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_trends');
  url.searchParams.set('q', query.trim());
  url.searchParams.set('data_type', 'GEO_MAP_0');
  url.searchParams.set('region', 'COUNTRY');
  url.searchParams.set('date', 'today 12-m');
  if (opts?.gprop) url.searchParams.set('gprop', opts.gprop);
  url.searchParams.set('api_key', apiKey);
  return url.toString();
}

/** SearchAPI: interest-by-region uses GEO_MAP + region=COUNTRY (worldwide geo). */
export function buildSearchApiInterestByRegionUrl(
  query: string,
  apiKey: string,
  opts?: { gprop?: 'youtube' | 'images' | 'news' | 'froogle' }
): string {
  const url = new URL('https://www.searchapi.io/api/v1/search');
  url.searchParams.set('engine', 'google_trends');
  url.searchParams.set('q', query.trim());
  url.searchParams.set('data_type', 'GEO_MAP');
  url.searchParams.set('region', 'COUNTRY');
  url.searchParams.set('time', 'today 12-m');
  if (opts?.gprop) url.searchParams.set('gprop', opts.gprop);
  url.searchParams.set('api_key', apiKey);
  return url.toString();
}

async function fetchInterestByRegionUrl(url: string): Promise<GeoShare[]> {
  const signal = AbortSignal.timeout(GEO_MAP_TIMEOUT_MS);
  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) return [];
  const data = await res.json();
  return parseInterestByRegion(data).slice(0, 10);
}

export async function fetchGoogleInterestByRegion(
  query: string,
  opts?: GeoFetchOpts
): Promise<GeoShare[]> {
  const q = query.trim();
  if (!q) return [];
  const serpKey = process.env.SERPAPI_KEY?.trim();
  const searchApiKey = process.env.SEARCHAPI_KEY?.trim() || process.env.SEARCHAPI_API_KEY?.trim();
  const gprop = isYouTubePlatform(opts?.platform) ? ('youtube' as const) : undefined;

  const attempts: Array<() => Promise<GeoShare[]>> = [];
  if (serpKey) {
    attempts.push(() =>
      fetchInterestByRegionUrl(buildSerpInterestByRegionUrl(q, serpKey, { gprop }))
    );
    if (gprop) {
      attempts.push(() => fetchInterestByRegionUrl(buildSerpInterestByRegionUrl(q, serpKey)));
    }
  }
  if (searchApiKey) {
    attempts.push(() =>
      fetchInterestByRegionUrl(buildSearchApiInterestByRegionUrl(q, searchApiKey, { gprop }))
    );
    if (gprop) {
      attempts.push(() =>
        fetchInterestByRegionUrl(buildSearchApiInterestByRegionUrl(q, searchApiKey))
      );
    }
  }

  try {
    for (const run of attempts) {
      const parsed = await run();
      if (parsed.length) return parsed;
    }
  } catch {
    return [];
  }
  return [];
}

export async function collectRealGeoShares(opts: {
  title: string;
  platform?: string | null;
  existingShares?: GeoShare[] | null;
  existingRegions?: string[] | null;
  storedCountryShares?: GeoShare[] | null;
  attempts?: number;
  delayMs?: number | ((attempt: number) => number);
  sleep?: (ms: number) => Promise<void>;
  fetchInterestByRegion?: (query: string, fetchOpts?: GeoFetchOpts) => Promise<GeoShare[]>;
}): Promise<GeoShare[]> {
  const stored = mergeGeoShares(opts.existingShares, opts.storedCountryShares);
  if (hasRealCountryMix({ shares: stored })) return stored.slice(0, 10);

  const fetchRegion = opts.fetchInterestByRegion ?? fetchGoogleInterestByRegion;
  const fetched = await untilRealResult({
    attempts: opts.attempts ?? 5,
    delayMs: opts.delayMs ?? ((attempt) => Math.min(4000, 400 * attempt)),
    sleep: opts.sleep,
    isReal: (shares) => hasRealCountryMix({ shares }),
    run: () => fetchRegion(opts.title, { platform: opts.platform }),
  });

  if (fetched?.length) return fetched.slice(0, 10);

  if (hasRealCountryMix({ regions: opts.existingRegions })) {
    return [];
  }
  return [];
}
