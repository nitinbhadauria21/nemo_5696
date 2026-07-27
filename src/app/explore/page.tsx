'use client';

import AppLayout from '@/components/AppLayout';
import ExploreContent from './components/ExploreContent';
import { useTrackPageView } from '@/lib/analytics/client';

export default function ExplorePage() {
  useTrackPageView('explore');
  return (
    <AppLayout>
      <ExploreContent />
    </AppLayout>
  );
}
