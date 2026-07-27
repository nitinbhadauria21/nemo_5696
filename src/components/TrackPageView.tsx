'use client';

import { useTrackPageView } from '@/lib/analytics/client';

/** Drop-in client component for server pages that need a page.view event. */
export default function TrackPageView({ page }: { page: string }) {
  useTrackPageView(page);
  return null;
}
