'use client';

import { useEffect, useRef } from 'react';

const SESSION_KEY = 'nemo_analytics_session';
const HEARTBEAT_MS = 30_000;

export function getOrCreateSessionId(): string {
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

/** Persist a keyword search (debounced callers). */
export function trackSearchQuery(opts: {
  query: string;
  source?: 'dashboard' | 'explore' | 'global';
  resultCount?: number;
  pagePath?: string;
  filters?: Record<string, unknown>;
}): void {
  if (typeof window === 'undefined') return;
  const q = opts.query.trim();
  if (q.length < 2) return;
  try {
    void fetch('/api/analytics/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: q,
        source: opts.source ?? 'global',
        resultCount: opts.resultCount ?? null,
        pagePath: opts.pagePath ?? window.location.pathname,
        filters: opts.filters ?? {},
      }),
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

/** Visibility-aware 30s heartbeat → increments user_sessions.active_ms. */
export function useSessionHeartbeat(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionId = getOrCreateSessionId();

    const send = () => {
      if (document.visibilityState !== 'visible') return;
      void fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'session.heartbeat',
          event_category: 'session',
          page_path: window.location.pathname,
          session_id: sessionId,
          properties: { active_ms_delta: HEARTBEAT_MS },
          heartbeat: true,
        }),
        keepalive: true,
      }).catch(() => {});
    };

    send();
    const id = window.setInterval(send, HEARTBEAT_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') send();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
}
