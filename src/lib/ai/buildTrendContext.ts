import { createClient } from '@/lib/supabase/server';

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'what',
  'how',
  'why',
  'when',
  'where',
  'who',
  'which',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'can',
  'may',
  'might',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'and',
  'or',
  'but',
  'not',
  'this',
  'that',
  'it',
  'its',
  'my',
  'your',
  'his',
  'her',
  'their',
  'our',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'me',
  'him',
  'us',
  'them',
  'about',
  'into',
  'over',
  'after',
  'before',
  'between',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'having',
  'am',
  'just',
  'so',
  'than',
  'too',
  'very',
  'some',
  'any',
  'all',
  'each',
  'every',
  'no',
  'if',
  'then',
  'else',
  'also',
  'up',
]);

function extractKeywords(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 5);
}

function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type TrendRow = {
  topic_text: string;
  platform: string;
  nemo_score: number;
  geo_regions: string[] | null;
  collected_at: string;
};

export async function buildTrendContext(lastUserMessage: string): Promise<string> {
  try {
    const supabase = await createClient();
    if (!supabase) return '';

    const keywords = extractKeywords(lastUserMessage);
    let rows: TrendRow[] = [];

    if (keywords.length > 0) {
      const orFilter = keywords.map((k) => `topic_text.ilike.%${k}%`).join(',');
      const { data } = await supabase
        .from('trend_records')
        .select('topic_text, platform, nemo_score, geo_regions, collected_at')
        .or(orFilter)
        .order('nemo_score', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const seen = new Set<string>();
        rows = (data as TrendRow[])
          .filter((r) => {
            if (seen.has(r.topic_text)) return false;
            seen.add(r.topic_text);
            return true;
          })
          .slice(0, 5);
      }
    }

    if (rows.length === 0) {
      const { data } = await supabase
        .from('trend_records')
        .select('topic_text, platform, nemo_score, geo_regions, collected_at')
        .order('nemo_score', { ascending: false })
        .limit(5);
      if (data) rows = data as TrendRow[];
    }

    if (rows.length === 0) return '';

    const lines = rows.map((r, i) => {
      const geo = r.geo_regions?.[0] ?? 'Global';
      const active = relativeTime(r.collected_at);
      return `${i + 1}. "${r.topic_text}" — ${r.platform}, score ${r.nemo_score}, geo: ${geo}, active: ${active}`;
    });

    return `[Nemo Trend Data]\n${lines.join('\n')}\n[End Trend Data]`;
  } catch {
    return '';
  }
}
