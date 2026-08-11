/**
 * Strip vendor / infra wording from anything shown to end users.
 * Keep logs and server comments free to mention internals; never leak to UI.
 */

import { BRIEF_NICHES } from '@/lib/mockData';

const VENDOR_PATTERNS: RegExp[] = [
  /\bscrapecreators?\b/gi,
  /\bscrape\s*creators?\b/gi,
  /\bserpapi\b/gi,
  /\bsearchapi\b/gi,
  /\bsupabase\b/gi,
  /\bapify\b/gi,
  /\bphyllo\b/gi,
  /\bgetdaytrends\b/gi,
  /\bvercel\b/gi,
  /\bopenai\b/gi,
  /\banthropic\b/gi,
  /\bapi[_\s-]?key\b/gi,
  /\bBearer\b/g,
  /\bCRON_SECRET\b/gi,
  /\bSCRAPECREATORS[_\w]*\b/gi,
  /\bYOUTUBE_API_KEY\b/gi,
  /\bSERPAPI_KEY\b/gi,
  /\bvia\s+scrape[^\s.]*/gi,
];

const BRIEF = BRIEF_NICHES as readonly string[];

type NicheRule = { niche: string; re: RegExp };

const NICHE_RULES: NicheRule[] = [
  {
    niche: 'AI',
    re: /\b(ai|artificial intelligence|chatgpt|gpt-?\d|claude|llm|machine learning|deep learning|neural|openai|anthropic|midjourney|stable diffusion|robot|coding|software|tech|saas)\b/i,
  },
  {
    niche: 'Fitness',
    re: /\b(fit(ness)?|gym|workout|health|wellness|sport|cricket|ipl|football|soccer|nba|nfl|athlete|yoga|run(ning)?|muscle|cardio)\b/i,
  },
  {
    niche: 'Finance',
    re: /\b(financ|crypto|bitcoin|ethereum|stock|invest|upi|bank|money|trading|nft|fintech|budget|tax|rupee|dollar)\b/i,
  },
  {
    niche: 'Fashion',
    re: /\b(fashion|beauty|style|outfit|luxury|makeup|skincare|sneaker|streetwear|model|runway|couture)\b/i,
  },
  {
    niche: 'Gaming',
    re: /\b(game|gaming|esport|steam|xbox|playstation|minecraft|fortnite|roblox|twitch|nintendo|valorant|gta)\b/i,
  },
  {
    niche: 'Movies',
    re: /\b(movie|film|cinema|netflix|disney|trailer|series|tv\s?show|television|bollywood|hollywoodlywood|oscar|actor|actress|anime)\b/i,
  },
  {
    niche: 'Education',
    re: /\b(educat|learn|course|school|study|productiv|notion|tutorial|exam|university|college|lesson|teach)\b/i,
  },
  {
    niche: 'Startups',
    re: /\b(startup|entrepreneur|saas|b2b|business|market(ing)?|seo|ads|brand|founder|vc|venture|growth hack)\b/i,
  },
  {
    niche: 'Travel',
    re: /\b(travel|tourism|flight|hotel|vacation|trip|airline|passport|visa|backpack|resort|beach holiday)\b/i,
  },
  {
    niche: 'Food',
    re: /\b(food|cook|recipe|restaurant|cuisine|chef|baking|meal|street food|pizza|burger|coffee|cafe)\b/i,
  },
];

const DUMP_BUCKETS = new Set(['other', 'unknown', 'general', 'misc', 'miscellaneous', 'uncategorized', '']);

/**
 * Classify a trend into a brief UI niche from title + caption + hashtags + raw niche.
 * Never returns the dump bucket "other" when any text is present — defaults to AI.
 */
export function classifyTrendNiche(input: {
  title?: string | null;
  caption?: string | null;
  description?: string | null;
  hashtags?: string[] | null;
  rawNiche?: string | null;
}): string {
  const raw = String(input.rawNiche || '').trim();
  if (raw && BRIEF.includes(raw)) return raw;

  const rawLower = raw.toLowerCase();
  if (raw && !DUMP_BUCKETS.has(rawLower)) {
    for (const rule of NICHE_RULES) {
      if (rule.re.test(raw)) return rule.niche;
    }
  }

  const tags = (input.hashtags || []).map((h) => String(h || '')).join(' ');
  const blob = [input.title, input.caption, input.description, tags, raw]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' \n ');

  if (!blob) return 'AI';

  for (const rule of NICHE_RULES) {
    if (rule.re.test(blob)) return rule.niche;
  }

  // Subreddit / platform-ish hints
  if (/\br\/?(fitness|bodybuilding|running|sports)\b/i.test(blob)) return 'Fitness';
  if (/\br\/?(cryptocurrency|personalfinance|investing|stocks)\b/i.test(blob)) return 'Finance';
  if (/\br\/?(gaming|games|pcgaming)\b/i.test(blob)) return 'Gaming';
  if (/\br\/?(movies|television|netflix)\b/i.test(blob)) return 'Movies';
  if (/\br\/?(food|cooking|recipes)\b/i.test(blob)) return 'Food';
  if (/\br\/?(travel|solotravel)\b/i.test(blob)) return 'Travel';
  if (/\br\/?(learnprogramming|education|getdisciplined)\b/i.test(blob)) return 'Education';
  if (/\br\/?(startups|entrepreneur|marketing)\b/i.test(blob)) return 'Startups';
  if (/\br\/?(machinelearning|artificial|chatgpt|singularity|technology)\b/i.test(blob)) return 'AI';

  return 'AI';
}

/** Map stale / DB niches onto brief UI labels. */
export function normalizeUiNiche(raw: string | undefined | null, titleHint = ''): string {
  return classifyTrendNiche({ rawNiche: raw, title: titleHint });
}

export function sanitizePublicText(input: string | undefined | null, fallback = ''): string {
  if (!input) return fallback;
  let out = String(input);
  for (const re of VENDOR_PATTERNS) {
    out = out.replace(re, '');
  }
  out = out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+via\s*$/i, '')
    .trim();
  return out || fallback;
}

export function userFacingPlatformStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'live') return 'Live';
  if (s === 'partial') return 'Partial';
  if (s === 'estimated') return 'Limited';
  if (s === 'unavailable' || s === 'disabled' || s === 'error') return 'Unavailable';
  if (s === 'demo') return 'Demo';
  return 'Checking';
}
