/**
 * Strip vendor / infra wording from anything shown to end users.
 * Keep logs and server comments free to mention internals; never leak to UI.
 */

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

/** Map stale / DB niches onto brief UI labels. */
export function normalizeUiNiche(raw: string | undefined | null, titleHint = ''): string {
  const text = `${raw || ''} ${titleHint}`.trim();
  if (!text) return 'AI';

  const exact = text.trim();
  const brief = [
    'AI',
    'Fitness',
    'Finance',
    'Fashion',
    'Gaming',
    'Movies',
    'Education',
    'Startups',
    'Travel',
    'Food',
  ];
  if (brief.includes(exact)) return exact;

  const c = text.toLowerCase();
  if (c === 'other' || c === 'unknown' || c === 'general') {
    // Classify from title when niche is a dump bucket
    return normalizeUiNiche(titleHint || 'AI');
  }
  if (/\b(ai|artificial|tech|gpt|claude|llm|software|coding|robot)\b/.test(c) || c === 'ai')
    return 'AI';
  if (/\b(fit|gym|workout|health|wellness|sport)\b/.test(c) || c === 'fitness' || c === 'sports')
    return 'Fitness';
  if (/\b(financ|crypto|stock|invest|upi|bank|money)\b/.test(c) || c === 'finance')
    return 'Finance';
  if (/\b(fashion|beauty|style|outfit|luxury)\b/.test(c) || c === 'fashion') return 'Fashion';
  if (/\b(game|gaming|esport)\b/.test(c) || c === 'gaming') return 'Gaming';
  if (/\b(movie|film|cinema|netflix|trailer)\b/.test(c) || c === 'movies') return 'Movies';
  if (/\b(educat|learn|course|school|study|productiv)\b/.test(c) || c === 'education')
    return 'Education';
  if (
    /\b(startup|entrepreneur|saas|b2b|business|market|seo|ads|brand)\b/.test(c) ||
    c === 'startups' ||
    c === 'business' ||
    c === 'marketing' ||
    c === 'productivity'
  )
    return 'Startups';
  if (/\b(travel|tourism|flight|hotel|vacation)\b/.test(c) || c === 'travel') return 'Travel';
  if (/\b(food|cook|recipe|restaurant|cuisine)\b/.test(c) || c === 'food') return 'Food';
  // Last resort: if raw was only "other", fall through title; else Startups-safe default AI
  if (!titleHint) return 'AI';
  return 'AI';
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
