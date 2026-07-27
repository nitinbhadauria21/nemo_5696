'use client';

import { useEffect, useRef } from 'react';

const SESSION_KEY = 'nemo_analytics_session';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Fire a single analytics event to the server (best-effort). */
export function trackClientEvent(opts: {
  eventName: string;
  eventCategory?: string;
  pagePath?: string;
  properties?: Record<string, unknown>;
}): void {
  if (typeof window === 'undefined') return;
  const payload = {
    event_name: opts.eventName,
    event_category: opts.eventCategory,
    page_path: opts.pagePath ?? window.location.pathname,
    properties: opts.properties ?? {},
    session_id: getOrCreateSessionId(),
  };
  try {
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/** On mount, record one page.view for the current path (once per mount). */
export function useTrackPageView(pageName?: string): void {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const path = typeof window !== 'undefined' ? window.location.pathname : pageName || '/';
    trackClientEvent({
      eventName: 'page.view',
      eventCategory: 'page',
      pagePath: path,
      properties: pageName ? { page: pageName } : undefined,
    });
  }, [pageName]);
}
