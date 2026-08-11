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
      key: 'INSTAGRAM_ACCESS_TOKEN',
      present: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim()),
    },
    {
      platform: 'linkedin',
      key: 'LINKEDIN_ACCESS_TOKEN',
      present: Boolean(process.env.LINKEDIN_ACCESS_TOKEN?.trim()),
    },
    {
      platform: 'twitter',
      key: 'TWITTER_BEARER_TOKEN',
      present: Boolean(process.env.TWITTER_BEARER_TOKEN?.trim()),
    },
    {
      platform: 'tiktok',
      key: 'TIKTOK_CLIENT_KEY (+ partner)',
      present: Boolean(process.env.TIKTOK_CLIENT_KEY?.trim()),
    },
  ];
}
