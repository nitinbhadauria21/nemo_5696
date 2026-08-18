import type { SupabaseClient } from '@supabase/supabase-js';
import type { GeoShare } from './geoChart';
import { hasRealCountryMix } from './geoChart';
import { collectRealGeoShares } from './enrichGeo';
import { enrichSourceMedia } from './enrichSources';
import { isRealHttpUrl, isRealSourceMedia } from './mediaResolve';
import { mergeSourceMediaPatch } from './persist';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type EnrichKind = 'geo' | 'sources' | 'all';

export type EnrichedSource = {
  id: number;
  platform: string;
  title: string | null;
  url: string | null;
  creator: string | null;
  published_at: string | null;
  collected_at: string;
  metadata?: Record<string, unknown> | null;
};

async function trendDb(): Promise<SupabaseClient | null> {
  return createAdminClient() ?? (await createClient());
}

function sharesFromRaw(raw: unknown): GeoShare[] {
  if (!raw || typeof raw !== 'object') return [];
  const geoShares = (raw as { geoShares?: unknown }).geoShares;
  if (!Array.isArray(geoShares)) return [];
  return geoShares
    .map((s) => {
      if (!s || typeof s !== 'object') return null;
      const o = s as Record<string, unknown>;
      const country = String(o.country ?? o.code ?? '');
      const share = Number(o.share);
      if (!country || !Number.isFinite(share) || share <= 0) return null;
      return { country, share };
    })
    .filter((s): s is GeoShare => s != null);
}

export async function persistTrendGeoShares(
  supabase: SupabaseClient,
  trendId: string,
  shares: GeoShare[]
): Promise<void> {
  const { data: row } = await supabase
    .from('trend_records')
    .select('raw_platform_data, geo_regions')
    .eq('trend_id', trendId)
    .maybeSingle();
  if (!row) return;
  const raw =
    row.raw_platform_data && typeof row.raw_platform_data === 'object'
      ? { ...(row.raw_platform_data as Record<string, unknown>) }
      : {};
  const regions = shares.map((s) => s.country);
  raw.geoShares = shares;
  raw.geoRegions = regions;
  raw.geoSpreadScore = shares.length;
  await supabase
    .from('trend_records')
    .update({
      geo_regions: regions,
      geo_spread_score: shares.length,
      raw_platform_data: raw,
    })
    .eq('trend_id', trendId);
}

async function persistSourceMedia(
  supabase: SupabaseClient,
  source: EnrichedSource,
  patch: { url?: string; thumbnail?: string }
): Promise<EnrichedSource> {
  const merged = mergeSourceMediaPatch(
    {
      url: source.url,
      metadata: (source.metadata as Record<string, unknown> | null) || {},
    },
    patch
  );
  await supabase
    .from('trend_sources')
    .update({ url: merged.url, metadata: merged.metadata })
    .eq('id', source.id);
  return { ...source, url: merged.url, metadata: merged.metadata };
}

async function insertEnrichedSource(
  supabase: SupabaseClient,
  trendId: string,
  platform: string,
  title: string,
  media: { url?: string; thumbnail?: string }
): Promise<EnrichedSource | null> {
  if (!isRealSourceMedia(media)) return null;
  const now = new Date().toISOString();
  const metadata: Record<string, unknown> = { historical: false };
  if (media.thumbnail) metadata.thumbnail = media.thumbnail;
  const { data, error } = await supabase
    .from('trend_sources')
    .insert({
      trend_id: trendId,
      platform,
      title,
      url: media.url || null,
      metadata,
      collected_at: now,
    })
    .select('*')
    .maybeSingle();
  if (error || !data) return null;
  return data as EnrichedSource;
}

export async function enrichTrendOnDemand(
  trendId: string,
  kind: EnrichKind = 'all'
): Promise<{
  geoShares: GeoShare[];
  geoRegions: string[];
  sources: EnrichedSource[];
  geoFailed: boolean;
}> {
  const supabase = await trendDb();
  const empty = {
    geoShares: [] as GeoShare[],
    geoRegions: [] as string[],
    sources: [] as EnrichedSource[],
    geoFailed: false,
  };

  if (!supabase) return empty;

  const { data: row } = await supabase
    .from('trend_records')
    .select('trend_id, topic_text, platform, platforms_present, geo_regions, raw_platform_data')
    .eq('trend_id', trendId)
    .maybeSingle();

  if (!row) return empty;

  const title = String(
    (row.raw_platform_data as { title?: string } | null)?.title || row.topic_text || ''
  );
  const raw = row.raw_platform_data;
  let geoShares = sharesFromRaw(raw);
  let geoRegions = Array.isArray(row.geo_regions) ? (row.geo_regions as string[]) : [];
  let geoFailed = false;

  const { data: sourceRows } = await supabase
    .from('trend_sources')
    .select('*')
    .eq('trend_id', trendId)
    .order('collected_at', { ascending: false })
    .limit(50);
  let sources = (sourceRows || []) as EnrichedSource[];

  if (kind === 'geo' || kind === 'all') {
    if (!hasRealCountryMix({ shares: geoShares, regions: geoRegions })) {
      const fetched = await collectRealGeoShares({
        title,
        platform: String(row.platform || ''),
        existingShares: geoShares,
        existingRegions: geoRegions,
      });
      if (fetched.length) {
        geoShares = fetched;
        geoRegions = fetched.map((s) => s.country);
        await persistTrendGeoShares(supabase, trendId, fetched);
      } else {
        geoFailed = !hasRealCountryMix({ shares: geoShares, regions: geoRegions });
      }
    }
  }

  if (kind === 'sources' || kind === 'all') {
    const platforms = (
      Array.isArray(row.platforms_present) ? row.platforms_present : [row.platform]
    ) as string[];
    const fallbackPlatform = String(platforms[0] || row.platform || 'youtube');

    if (!sources.length) {
      const media = await enrichSourceMedia({
        platform: fallbackPlatform,
        title,
      });
      const inserted = await insertEnrichedSource(
        supabase,
        trendId,
        fallbackPlatform === 'google_trends' ? 'youtube' : fallbackPlatform,
        title,
        media
      );
      if (inserted) sources = [inserted];
    } else {
      const next: EnrichedSource[] = [];
      for (const source of sources) {
        const meta = (source.metadata || {}) as Record<string, unknown>;
        const thumb =
          (typeof meta.thumbnail === 'string' && meta.thumbnail) ||
          (typeof meta.imageUrl === 'string' && meta.imageUrl) ||
          null;
        if (isRealSourceMedia({ url: source.url, thumbnail: thumb })) {
          if (isRealHttpUrl(source.url) && !isRealHttpUrl(thumb)) {
            const filled = await enrichSourceMedia({
              platform: source.platform,
              title: source.title || title,
              url: source.url,
              thumbnail: thumb,
              externalId: (source as { external_id?: string }).external_id,
            });
            if (filled.thumbnail && filled.thumbnail !== thumb) {
              next.push(await persistSourceMedia(supabase, source, filled));
              continue;
            }
          }
          next.push(source);
          continue;
        }
        const filled = await enrichSourceMedia({
          platform: source.platform,
          title: source.title || title,
          url: source.url,
          thumbnail: thumb,
          externalId: (source as { external_id?: string }).external_id,
        });
        if (isRealSourceMedia(filled)) {
          next.push(await persistSourceMedia(supabase, source, filled));
        } else {
          next.push(source);
        }
      }
      sources = next;
    }
  }

  return { geoShares, geoRegions, sources, geoFailed };
}
