import { COUNTRIES } from '@/lib/countries';

export type GeoShare = { country: string; share: number };
export type GeoChartRow = { region: string; code: string; share: number };

const PLACEHOLDER_GEOS = new Set(['GLOBAL', 'WW', 'WORLD']);

const COUNTRY_NAMES: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code.toUpperCase(), c.name])
);

/** Common aliases that are not ISO 3166-1 alpha-2. */
COUNTRY_NAMES.UK = COUNTRY_NAMES.GB || 'United Kingdom';

export function isPlaceholderGeo(code: string | null | undefined): boolean {
  if (!code) return true;
  return PLACEHOLDER_GEOS.has(code.trim().toUpperCase());
}

export function countryDisplayName(code: string): string {
  const upper = code.trim().toUpperCase();
  if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(upper);
    if (name && name !== upper) return name;
  } catch {
    /* ignore invalid region codes */
  }
  return upper;
}

function normalizeCountryCode(raw: string): string | null {
  const upper = String(raw || '')
    .trim()
    .toUpperCase();
  if (!upper || isPlaceholderGeo(upper)) return null;
  if (upper === 'UK') return 'GB';
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return upper;
}

export function resolveCollectionGeoCodes(
  override?: string | null,
  fallbackEnv?: string | null
): string[] {
  const raw = (override ?? fallbackEnv ?? '').trim().toUpperCase();
  if (!raw || isPlaceholderGeo(raw)) return [];
  const code = normalizeCountryCode(raw.slice(0, 2));
  return code ? [code] : [];
}

export function normalizeGeoRegionCodes(regions?: string[] | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of regions ?? []) {
    const code = normalizeCountryCode(String(r));
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

function shareValue(entry: Record<string, unknown>): number {
  const raw = entry.extracted_value ?? entry.value ?? entry.share ?? entry.max_value_index;
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function countryFromRegionEntry(entry: Record<string, unknown>): string | null {
  const raw =
    entry.geo ??
    entry.country_code ??
    entry.countryCode ??
    entry.code ??
    entry.country ??
    entry.location;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return normalizeCountryCode(trimmed);
  return null;
}

/** Parse SerpAPI / SearchAPI Google Trends GEO_MAP payloads. */
export function parseInterestByRegion(payload: unknown): GeoShare[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  const list = root.interest_by_region ?? root.interestByRegion ?? root.geo_map ?? root.geoMap;
  if (!Array.isArray(list)) return [];

  const byCode = new Map<string, number>();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const code = countryFromRegionEntry(entry);
    if (!code) continue;
    const share = shareValue(entry);
    if (share <= 0) continue;
    byCode.set(code, Math.max(byCode.get(code) ?? 0, share));
  }

  return [...byCode.entries()]
    .map(([country, share]) => ({ country, share }))
    .sort((a, b) => b.share - a.share);
}

function rowsFromShares(shares: GeoShare[], limit: number): GeoChartRow[] {
  const byCode = new Map<string, number>();
  for (const s of shares) {
    const code = normalizeCountryCode(s.country);
    if (!code) continue;
    const share = Number(s.share);
    if (!Number.isFinite(share) || share <= 0) continue;
    byCode.set(code, Math.max(byCode.get(code) ?? 0, share));
  }
  return [...byCode.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([code, share]) => ({
      code,
      region: countryDisplayName(code),
      share,
    }));
}

/**
 * Ranked geographic split for the trend-detail chart.
 * Never emits a GLOBAL / WW bar — those are collection placeholders, not countries.
 */
export function buildGeoChartRows(opts: {
  regions?: string[] | null;
  shares?: GeoShare[] | null;
  limit?: number;
}): GeoChartRow[] {
  const limit = opts.limit ?? 10;
  if (opts.shares?.length) {
    const fromShares = rowsFromShares(opts.shares, limit);
    if (fromShares.length) return fromShares;
  }

  const codes = normalizeGeoRegionCodes(opts.regions);
  if (!codes.length) return [];

  const n = Math.min(codes.length, limit);
  return codes.slice(0, n).map((code, i) => ({
    code,
    region: countryDisplayName(code),
    // Ranked presence when collectors only stored codes (relative to first).
    share: Math.max(8, Math.round(100 * (1 - i / Math.max(n, 2)))),
  }));
}

/** True when the chart can render at least one real country (never GLOBAL). */
export function hasRealCountryMix(opts: {
  regions?: string[] | null;
  shares?: GeoShare[] | null;
}): boolean {
  return buildGeoChartRows({ ...opts, limit: 10 }).length > 0;
}

export function mergeGeoShares(...lists: Array<GeoShare[] | undefined | null>): GeoShare[] {
  const byCode = new Map<string, number>();
  for (const list of lists) {
    for (const s of list ?? []) {
      const code = normalizeCountryCode(s.country);
      if (!code) continue;
      const share = Number(s.share);
      if (!Number.isFinite(share) || share <= 0) continue;
      byCode.set(code, Math.max(byCode.get(code) ?? 0, share));
    }
  }
  return [...byCode.entries()]
    .map(([country, share]) => ({ country, share }))
    .sort((a, b) => b.share - a.share);
}
