import { untilRealResult } from '@/lib/loop/untilRealResult';
import {
  isRealHttpUrl,
  isRealSourceMedia,
  youtubeThumbnailUrl,
  youtubeVideoIdFrom,
  youtubeWatchUrl,
} from './mediaResolve';

export type SourceMedia = {
  url?: string;
  thumbnail?: string;
};

export type YouTubeSearchHit = {
  id: string;
  url: string;
  thumbnail?: string;
};

function mediaFromVideoId(id: string, url?: string, thumbnail?: string): SourceMedia {
  return {
    url: isRealHttpUrl(url) ? url!.trim() : youtubeWatchUrl(id),
    thumbnail: isRealHttpUrl(thumbnail) ? thumbnail!.trim() : youtubeThumbnailUrl(id),
  };
}

export async function searchYouTubeVideo(query: string): Promise<YouTubeSearchHit | null> {
  const q = query.trim();
  if (!q) return null;

  const ytKey = process.env.YOUTUBE_API_KEY?.trim();
  if (ytKey) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('maxResults', '1');
      url.searchParams.set('q', q);
      url.searchParams.set('key', ytKey);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as {
          items?: Array<{ id?: { videoId?: string } }>;
        };
        const id = youtubeVideoIdFrom(json.items?.[0]?.id?.videoId);
        if (id) return { id, url: youtubeWatchUrl(id), thumbnail: youtubeThumbnailUrl(id) };
      }
    } catch {
      /* try next source */
    }
  }

  const serpKey = process.env.SERPAPI_KEY?.trim();
  if (serpKey) {
    try {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'youtube');
      url.searchParams.set('search_query', q);
      url.searchParams.set('api_key', serpKey);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as {
          video_results?: Array<{ link?: string; video_id?: string }>;
        };
        const first = json.video_results?.[0];
        const id = youtubeVideoIdFrom(first?.link) || youtubeVideoIdFrom(first?.video_id);
        if (id) return { id, url: youtubeWatchUrl(id), thumbnail: youtubeThumbnailUrl(id) };
      }
    } catch {
      /* give up */
    }
  }

  return null;
}

function shouldSearchYouTube(platform?: string | null): boolean {
  const p = String(platform || '').toLowerCase();
  return !p || p === 'youtube' || p === 'youtube_shorts' || p === 'google' || p === 'google_trends';
}

export async function enrichSourceMedia(opts: {
  platform?: string | null;
  title: string;
  url?: string | null;
  thumbnail?: string | null;
  externalId?: string | null;
  attempts?: number;
  delayMs?: number | ((attempt: number) => number);
  sleep?: (ms: number) => Promise<void>;
  searchYouTube?: (query: string) => Promise<YouTubeSearchHit | null>;
}): Promise<SourceMedia> {
  const fromId =
    youtubeVideoIdFrom(opts.url) ||
    youtubeVideoIdFrom(opts.externalId) ||
    youtubeVideoIdFrom(opts.title);
  if (fromId) {
    return mediaFromVideoId(fromId, opts.url || undefined, opts.thumbnail || undefined);
  }

  if (isRealSourceMedia({ url: opts.url, thumbnail: opts.thumbnail })) {
    const out: SourceMedia = {};
    if (isRealHttpUrl(opts.url)) out.url = opts.url!.trim();
    if (isRealHttpUrl(opts.thumbnail)) out.thumbnail = opts.thumbnail!.trim();
    return out;
  }

  if (!shouldSearchYouTube(opts.platform)) {
    const out: SourceMedia = {};
    if (isRealHttpUrl(opts.url)) out.url = opts.url!.trim();
    if (isRealHttpUrl(opts.thumbnail)) out.thumbnail = opts.thumbnail!.trim();
    return out;
  }

  const search = opts.searchYouTube ?? searchYouTubeVideo;
  const hit = await untilRealResult({
    attempts: opts.attempts ?? 4,
    delayMs: opts.delayMs ?? ((attempt) => Math.min(3000, 350 * attempt)),
    sleep: opts.sleep,
    isReal: (row) => Boolean(row && youtubeVideoIdFrom(row.id)),
    run: () => search(opts.title),
  });

  if (hit?.id) {
    return mediaFromVideoId(hit.id, hit.url, hit.thumbnail);
  }

  const out: SourceMedia = {};
  if (isRealHttpUrl(opts.url)) out.url = opts.url!.trim();
  if (isRealHttpUrl(opts.thumbnail)) out.thumbnail = opts.thumbnail!.trim();
  return out;
}
