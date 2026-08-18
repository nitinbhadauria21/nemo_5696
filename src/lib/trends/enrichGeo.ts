import { untilRealResult } from '@/lib/loop/untilRealResult';
import {
  hasRealCountryMix,
  mergeGeoShares,
  parseInterestByRegion,
  type GeoShare,
} from './geoChart';

const GEO_MAP_TIMEOUT_MS = 8000;

export async function fetchGoogleInterestByRegion(query: string): Promise<GeoShare[]> {
  const q = query.trim();
  if (!q) return [];
  const serpKey = process.env.SERPAPI_KEY?.trim();
  const searchApiKey = process.env.SEARCHAPI_KEY?.trim() || process.env.SEARCHAPI_API_KEY?.trim();
  const signal = AbortSignal.timeout(GEO_MAP_TIMEOUT_MS);

  const tryFetch = async (url: string): Promise<GeoShare[]> => {
    const res = await fetch(url, { cache: 'no-store', signal });
    if (!res.ok) return [];
    const data = await res.json();
    return parseInterestByRegion(data).slice(0, 10);
  };

  try {
    if (serpKey) {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_trends');
      url.searchParams.set('q', q);
      url.searchParams.set('data_type', 'GEO_MAP');
      url.searchParams.set('api_key', serpKey);
      const parsed = await tryFetch(url.toString());
      if (parsed.length) return parsed;
    }
    if (searchApiKey) {
      const url = new URL('https://www.searchapi.io/api/v1/search');
      url.searchParams.set('engine', 'google_trends');
      url.searchParams.set('q', q);
      url.searchParams.set('data_type', 'GEO_MAP');
      url.searchParams.set('api_key', searchApiKey);
      return await tryFetch(url.toString());
    }
  } catch {
    return [];
  }
  return [];
}

export async function collectRealGeoShares(opts: {
  title: string;
  existingShares?: GeoShare[] | null;
  existingRegions?: string[] | null;
  storedCountryShares?: GeoShare[] | null;
  attempts?: number;
  delayMs?: number | ((attempt: number) => number);
  sleep?: (ms: number) => Promise<void>;
  fetchInterestByRegion?: (query: string) => Promise<GeoShare[]>;
}): Promise<GeoShare[]> {
  const stored = mergeGeoShares(opts.existingShares, opts.storedCountryShares);
  if (hasRealCountryMix({ shares: stored })) return stored.slice(0, 10);

  const fetchRegion = opts.fetchInterestByRegion ?? fetchGoogleInterestByRegion;
  const fetched = await untilRealResult({
    attempts: opts.attempts ?? 5,
    delayMs: opts.delayMs ?? ((attempt) => Math.min(4000, 400 * attempt)),
    sleep: opts.sleep,
    isReal: (shares) => hasRealCountryMix({ shares }),
    run: () => fetchRegion(opts.title),
  });

  if (fetched?.length) return fetched.slice(0, 10);

  if (hasRealCountryMix({ regions: opts.existingRegions })) {
    return [];
  }
  return [];
}
