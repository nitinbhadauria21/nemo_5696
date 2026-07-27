import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type TrackEventInput = {
  userId?: string | null;
  sessionId?: string | null;
  eventName: string;
  eventCategory?: string | null;
  pagePath?: string | null;
  properties?: Record<string, unknown> | null;
  request?: NextRequest | Request | null;
};

const SENSITIVE_KEYS = /password|token|secret|authorization|api[_-]?key|cookie|credential/i;

/** Strip secrets from properties before persisting. */
export function sanitizeProperties(
  properties?: Record<string, unknown> | null
): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SENSITIVE_KEYS.test(key)) continue;
    if (typeof value === 'string' && value.length > 2000) {
      out[key] = value.slice(0, 2000);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function extractIp(request?: NextRequest | Request | null): string | null {
  if (!request) return null;
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || null;
}

function extractUserAgent(request?: NextRequest | Request | null): string | null {
  if (!request) return null;
  return request.headers.get('user-agent');
}

function guessDevice(ua: string | null): string | null {
  if (!ua) return null;
  const lower = ua.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(lower)) return 'mobile';
  if (/tablet/.test(lower)) return 'tablet';
  return 'desktop';
}

/**
 * Persist a user activity event via service role.
 * Never throws — failures are logged only so callers stay resilient.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;

    const ip = extractIp(input.request);
    const userAgent = extractUserAgent(input.request);

    const { error } = await admin.from('user_events').insert({
      user_id: input.userId || null,
      session_id: input.sessionId || null,
      event_name: input.eventName,
      event_category: input.eventCategory || null,
      page_path: input.pagePath || null,
      properties: sanitizeProperties(input.properties),
      ip,
      user_agent: userAgent,
    });

    if (error) {
      console.error('[analytics] trackEvent insert failed', error.message);
    }
  } catch (err) {
    console.error('[analytics] trackEvent error', err);
  }
}

/**
 * Upsert/touch a session row: bump last_seen_at and optionally page_count.
 */
export async function touchSession(opts: {
  sessionId: string;
  userId?: string | null;
  request?: NextRequest | Request | null;
  incrementPage?: boolean;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin || !opts.sessionId) return;

    const userAgent = extractUserAgent(opts.request);
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from('user_sessions')
      .select('id, page_count')
      .eq('id', opts.sessionId)
      .maybeSingle();

    if (existing) {
      const updates: Record<string, unknown> = {
        last_seen_at: now,
        user_agent: userAgent,
      };
      if (opts.userId) updates.user_id = opts.userId;
      if (opts.incrementPage) {
        updates.page_count = (existing.page_count ?? 0) + 1;
      }
      const { error } = await admin.from('user_sessions').update(updates).eq('id', opts.sessionId);
      if (error) console.error('[analytics] touchSession update failed', error.message);
      return;
    }

    const { error } = await admin.from('user_sessions').insert({
      id: opts.sessionId,
      user_id: opts.userId || null,
      started_at: now,
      last_seen_at: now,
      page_count: opts.incrementPage ? 1 : 0,
      device: guessDevice(userAgent),
      user_agent: userAgent,
    });
    if (error) console.error('[analytics] touchSession insert failed', error.message);
  } catch (err) {
    console.error('[analytics] touchSession error', err);
  }
}
