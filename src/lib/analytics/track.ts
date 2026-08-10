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

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]';
  if (typeof value === 'string') {
    if (value.length > 2000) return value.slice(0, 2000);
    // Drop obvious secret-in-value patterns
    if (/password\s*[:=]/i.test(value) || /bearer\s+[a-z0-9._-]+/i.test(value)) {
      return '[redacted]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => sanitizeValue(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    return sanitizeProperties(value as Record<string, unknown>, depth + 1);
  }
  return value;
}

/** Strip secrets from properties before persisting (recursive). */
export function sanitizeProperties(
  properties?: Record<string, unknown> | null,
  depth = 0
): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SENSITIVE_KEYS.test(key)) continue;
    out[key] = sanitizeValue(value, depth);
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
  entryPath?: string | null;
  exitPath?: string | null;
  activeMsDelta?: number;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin || !opts.sessionId) return;

    const userAgent = extractUserAgent(opts.request);
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from('user_sessions')
      .select('id, page_count, active_ms, entry_path')
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
      if (opts.activeMsDelta && opts.activeMsDelta > 0) {
        updates.active_ms = (existing.active_ms ?? 0) + opts.activeMsDelta;
      }
      if (opts.exitPath) updates.exit_path = opts.exitPath;
      if (!existing.entry_path && opts.entryPath) updates.entry_path = opts.entryPath;
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
      active_ms: opts.activeMsDelta && opts.activeMsDelta > 0 ? opts.activeMsDelta : 0,
      device: guessDevice(userAgent),
      user_agent: userAgent,
      entry_path: opts.entryPath ?? null,
      exit_path: opts.exitPath ?? null,
    });
    if (error) console.error('[analytics] touchSession insert failed', error.message);
  } catch (err) {
    console.error('[analytics] touchSession error', err);
  }
}
