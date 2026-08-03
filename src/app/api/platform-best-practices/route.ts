import { NextResponse } from 'next/server';

const TIPS: Record<string, string[]> = {
  instagram: [
    'Post Reels within 1h of trend peak',
    'Use 3-5 niche hashtags + 1 broad tag',
    'Hook in first 1.5 seconds',
  ],
  youtube: [
    'Shorts under 45s perform best for trends',
    'Title keyword match within first 40 chars',
    'Pin a comment with CTA',
  ],
  linkedin: [
    'Lead with a contrarian take',
    'Use document carousels for B2B trends',
    'Post Tuesday–Thursday 8–10am IST',
  ],
  google: [
    'Publish before search volume inflects',
    'Answer People Also Ask in first paragraph',
    'Update existing posts vs new URLs',
  ],
  tiktok: [
    'Trending audio within 24h of spike',
    'On-screen text for silent viewers',
    '3 cuts in first 2 seconds',
  ],
  twitter: [
    'Thread format for complex trends',
    'Quote-tweet with added insight',
    'Post during local peak hours',
  ],
  reddit: ['Comment early on rising threads', 'Avoid overt promotion', 'Match subreddit tone'],
};

export async function GET() {
  return NextResponse.json({ practices: TIPS });
}
