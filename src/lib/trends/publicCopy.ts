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
    re: /\b(artificial intelligence|chatgpt|gpt-?\d|claude|llms?|machine learning|deep learning|neural nets?|openai|anthropic|midjourney|stable diffusion|generative ai|ai)\b/i,
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

const DUMP_BUCKETS = new Set([
  'other',
  'unknown',
  'general',
  'misc',
  'miscellaneous',
  'uncategorized',
  '',
]);

/**
 * Classify a trend into a brief UI niche from title + caption + hashtags + raw niche.
 * Unmatched text returns "other" (All feed only — not under named niche chips).
 * Never dump unknown lifestyle content into AI; do not permanently trust a stale AI label.
 */
export function classifyTrendNiche(input: {
  title?: string | null;
  caption?: string | null;
  description?: string | null;
  hashtags?: string[] | null;
  rawNiche?: string | null;
}): string {
  const raw = String(input.rawNiche || '').trim();
  const briefHit = BRIEF.find((b) => b.toLowerCase() === raw.toLowerCase());

  const tags = (input.hashtags || []).map((h) => String(h || '')).join(' ');
  // Do NOT include rawNiche in the evidence blob — a polluted "AI" label would
  // self-match the AI keyword rule and permanently stick.
  const blob = [input.title, input.caption, input.description, tags]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' \n ');

  // Prefer text evidence over a stored niche (especially polluted "AI" defaults).
  if (blob) {
    for (const rule of NICHE_RULES) {
      if (rule.re.test(blob)) return rule.niche;
    }
    if (/\br\/?(fitness|bodybuilding|running|sports)\b/i.test(blob)) return 'Fitness';
    if (/\br\/?(cryptocurrency|personalfinance|investing|stocks)\b/i.test(blob)) return 'Finance';
    if (/\br\/?(gaming|games|pcgaming)\b/i.test(blob)) return 'Gaming';
    if (/\br\/?(movies|television|netflix)\b/i.test(blob)) return 'Movies';
    if (/\br\/?(food|cooking|recipes)\b/i.test(blob)) return 'Food';
    if (/\br\/?(travel|solotravel)\b/i.test(blob)) return 'Travel';
    if (/\br\/?(learnprogramming|education|getdisciplined)\b/i.test(blob)) return 'Education';
    if (/\br\/?(startups|entrepreneur|marketing)\b/i.test(blob)) return 'Startups';
    if (
      /\br\/?(machinelearning|artificial|chatgpt|openai|llm|singularity|generative\s*ai)\b/i.test(
        blob
      )
    ) {
      return 'AI';
    }
  }

  // Non-AI stored niches can stand when text has no stronger signal
  if (briefHit && briefHit !== 'AI') return briefHit;

  if (raw && !DUMP_BUCKETS.has(raw.toLowerCase()) && !briefHit) {
    for (const rule of NICHE_RULES) {
      if (rule.re.test(raw)) return rule.niche;
    }
  }

  return 'other';
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
