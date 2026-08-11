import { instagramProvider } from './instagram';
import { youtubeProvider } from './youtube';
import { googleTrendsProvider } from './google-trends';
import { redditProvider } from './reddit';
import { tiktokProvider } from './tiktok';
import { linkedinProvider } from './linkedin';
import { xProvider } from './x';
import { facebookProvider } from './facebook';
import type { TrendProvider } from './types';

export * from './types';

export const ALL_PROVIDERS: TrendProvider[] = [
  googleTrendsProvider,
  youtubeProvider,
  redditProvider,
  instagramProvider,
  tiktokProvider,
  xProvider,
  facebookProvider,
  linkedinProvider,
];

export async function collectProviderHealth() {
  return Promise.all(
    ALL_PROVIDERS.map(async (p) => {
      const health = await p.getHealth();
      return {
        platform: p.id,
        displayName: p.displayName,
        ...health,
      };
    })
  );
}
