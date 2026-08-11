/**
 * ScrapeCreators client helpers for trend collectors.
 * Auth: x-api-key header. Base: https://api.scrapecreators.com
 * Env: SCRAPECREATORS_API_KEY (alias SCRAPE_CREATORS_API_KEY also accepted).
 */

const SC_BASE = 'https://api.scrapecreators.com';

export function getScrapeCreatorsApiKey(): string | null {
  return (
    process.env.SCRAPECREATORS_API_KEY?.trim() ||
    process.env.SCRAPE_CREATORS_API_KEY?.trim() ||
    null
  );
}

export async function scrapeCreatorsGet<T = Record<string, unknown>>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options?: { timeoutMs?: number }
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; error: string }> {
  const key = getScrapeCreatorsApiKey();
  if (!key) {
    return { ok: false, status: 0, error: 'SCRAPECREATORS_API_KEY missing' };
  }

  const url = new URL(path.startsWith('http') ? path : `${SC_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options?.timeoutMs ?? 45000);
  try {
    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': key, Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    const text = await res.text();
    let data: T | null = null;
    try {
      data = JSON.parse(text) as T;
    } catch {
      /* non-JSON */
    }
    if (!res.ok) {
      const msg =
        (data as { message?: string } | null)?.message ||
        text.slice(0, 240) ||
        `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: msg };
    }
    return { ok: true, status: res.status, data: data ?? ({} as T) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

/** Parse topic/hashtag tokens from a trends24-style Google snippet. */
export function parseTrendTokensFromText(text: string, limit = 10): string[] {
  if (!text) return [];
  const cleaned = text
    .replace(/\u00a0/g, ' ')
    .replace(/[·•|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const m of cleaned.matchAll(/#([\w\u00c0-\u024f]+)/gi)) {
    const t = `#${m[1]}`;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(t);
    if (tokens.length >= limit) return tokens;
  }

  const after =
    cleaned.split(/last 24 hours|trending topics|hashtags today|Today'?s top/i).pop() || cleaned;
  for (const part of after.split(/[,;]|(?:\s+[-–—]\s+)/)) {
    const t = part
      .replace(/https?:\/\/\S+/g, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^A·\s*/gi, '')
      .trim();
    if (t.length < 2 || t.length > 80) continue;
    if (/^(twitter|x|united states|explore|more|updated|timeline)/i.test(t)) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(t);
    if (tokens.length >= limit) break;
  }

  return tokens;
}
