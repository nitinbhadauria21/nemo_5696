/**
 * App-level trend collector credentials (cron / ingest).
 * Distinct from per-user Social Connect OAuth (user_connections.encrypted_tokens).
 */
export type CollectorKeyStatus = {
  key: string;
  present: boolean;
  platform: string;
};

export function getTrendCollectorEnvStatus(): CollectorKeyStatus[] {
  const scrapeCreators = Boolean(
    process.env.SCRAPECREATORS_API_KEY?.trim() || process.env.SCRAPE_CREATORS_API_KEY?.trim()
  );
  return [
    { platform: 'reddit', key: '(public JSON — no key)', present: true },
    {
      platform: 'youtube',
      key: 'YOUTUBE_API_KEY',
      present: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
    },
    {
      platform: 'google_trends',
      key: 'SERPAPI_KEY | SEARCHAPI_KEY | GOOGLE_TRENDS_PROXY_URL',
      present: Boolean(
        process.env.SERPAPI_KEY?.trim() ||
        process.env.SEARCHAPI_KEY?.trim() ||
        process.env.SEARCHAPI_API_KEY?.trim() ||
        process.env.GOOGLE_TRENDS_PROXY_URL?.trim()
      ),
    },
    {
      platform: 'instagram',
      key: 'SCRAPECREATORS_API_KEY (preferred) | INSTAGRAM_ACCESS_TOKEN',
      present: scrapeCreators || Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim()),
    },
    {
      platform: 'facebook',
      key: 'SCRAPECREATORS_API_KEY',
      present: scrapeCreators,
    },
    {
      platform: 'linkedin',
      key: 'LINKEDIN_ACCESS_TOKEN',
      present: Boolean(process.env.LINKEDIN_ACCESS_TOKEN?.trim()),
    },
    {
      platform: 'twitter',
      key: 'SCRAPECREATORS_API_KEY (preferred) | TWITTER_BEARER_TOKEN',
      present: scrapeCreators || Boolean(process.env.TWITTER_BEARER_TOKEN?.trim()),
    },
    {
      platform: 'tiktok',
      key: 'SCRAPECREATORS_API_KEY',
      present: scrapeCreators,
    },
  ];
}
