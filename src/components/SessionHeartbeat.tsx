'use client';

import { useSessionHeartbeat } from '@/lib/analytics/client';

/** Mount once in root layout to accumulate active_ms while tab is visible. */
export default function SessionHeartbeat() {
  useSessionHeartbeat();
  return null;
}
