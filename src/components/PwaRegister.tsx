'use client';

import { useEffect } from 'react';

/** Registers a minimal service worker for offline shell caching. */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && process.env.NEXT_PUBLIC_ENABLE_SW !== 'true') return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
