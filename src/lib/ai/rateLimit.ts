/**
 * In-memory sliding-window rate limiter for AI endpoints.
 *
 * Suitable for a single Node/Vercel instance. For multi-instance / horizontally
 * scaled deploys, replace with Redis or Vercel KV (shared store) — this module
 * is process-local and does not coordinate across replicas.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
};

type Bucket = {
  /** Timestamps (ms) of allowed hits still inside the window */
  hits: number[];
};

const store = new Map<string, Bucket>();

/** Default AI abuse ceilings (separate from monthly plan quota). */
export const AI_RATE_LIMITS = {
  ip: { limit: 30, windowMs: 60_000 },
  user: { limit: 20, windowMs: 60_000 },
} as const;

let lastPruneAt = 0;
const PRUNE_EVERY_MS = 60_000;

function pruneStale(now: number) {
  if (now - lastPruneAt < PRUNE_EVERY_MS) return;
  lastPruneAt = now;
  const maxWindow = Math.max(AI_RATE_LIMITS.ip.windowMs, AI_RATE_LIMITS.user.windowMs);
  for (const [key, bucket] of store) {
    bucket.hits = bucket.hits.filter((t) => now - t < maxWindow);
    if (bucket.hits.length === 0) store.delete(key);
  }
}

/**
 * Sliding-window check+record for a key.
 * Pure enough for unit tests when `now` is injected.
 */
export function checkSlidingWindow(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  pruneStale(now);
  let bucket = store.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    store.set(key, bucket);
  }

  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, remaining: 0, limit, retryAfterSec };
  }

  bucket.hits.push(now);
  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    limit,
    retryAfterSec: 0,
  };
}

/** Test helper — clears all buckets. */
export function resetRateLimitStoreForTests() {
  store.clear();
  lastPruneAt = 0;
}

export function checkAiIpRateLimit(ip: string, now = Date.now()): RateLimitResult {
  const { limit, windowMs } = AI_RATE_LIMITS.ip;
  return checkSlidingWindow(`ai:ip:${ip || 'unknown'}`, limit, windowMs, now);
}

export function checkAiUserRateLimit(userId: string, now = Date.now()): RateLimitResult {
  const { limit, windowMs } = AI_RATE_LIMITS.user;
  return checkSlidingWindow(`ai:user:${userId}`, limit, windowMs, now);
}

/**
 * Enforce both per-IP and per-user windows. Returns the first denial.
 * Call after auth so userId is known; IP still applies when spoofed as "unknown".
 */
export function enforceAiHttpRateLimits(
  ip: string,
  userId: string,
  now = Date.now()
): { ok: true } | { ok: false; scope: 'ip' | 'user'; result: RateLimitResult } {
  const ipResult = checkAiIpRateLimit(ip, now);
  if (!ipResult.allowed) {
    return { ok: false, scope: 'ip', result: ipResult };
  }
  const userResult = checkAiUserRateLimit(userId, now);
  if (!userResult.allowed) {
    return { ok: false, scope: 'user', result: userResult };
  }
  return { ok: true };
}
