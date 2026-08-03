import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  AI_RATE_LIMITS,
  checkSlidingWindow,
  enforceAiHttpRateLimits,
  resetRateLimitStoreForTests,
} from './rateLimit';

describe('checkSlidingWindow', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it('allows up to limit hits inside the window', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const r = checkSlidingWindow('k', 5, 60_000, now + i);
      assert.equal(r.allowed, true);
      assert.equal(r.remaining, 5 - (i + 1));
    }
    const blocked = checkSlidingWindow('k', 5, 60_000, now + 10);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSec >= 1);
  });

  it('slides: oldest hit expiry frees a slot', () => {
    const windowMs = 1000;
    const now = 10_000;
    assert.equal(checkSlidingWindow('slide', 2, windowMs, now).allowed, true);
    assert.equal(checkSlidingWindow('slide', 2, windowMs, now + 1).allowed, true);
    assert.equal(checkSlidingWindow('slide', 2, windowMs, now + 2).allowed, false);
    // After first hit ages out
    const after = checkSlidingWindow('slide', 2, windowMs, now + windowMs + 1);
    assert.equal(after.allowed, true);
  });
});

describe('enforceAiHttpRateLimits', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it('enforces per-user ceiling independently of IP', () => {
    const now = 2_000_000;
    const userLimit = AI_RATE_LIMITS.user.limit;
    for (let i = 0; i < userLimit; i++) {
      const r = enforceAiHttpRateLimits('1.1.1.1', 'user-a', now + i);
      assert.equal(r.ok, true);
    }
    const blocked = enforceAiHttpRateLimits('1.1.1.1', 'user-a', now + userLimit);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.scope, 'user');

    // Different user on same IP still allowed (until IP limit)
    const other = enforceAiHttpRateLimits('1.1.1.1', 'user-b', now + userLimit + 1);
    assert.equal(other.ok, true);
  });

  it('enforces per-IP ceiling across users', () => {
    const now = 3_000_000;
    const ipLimit = AI_RATE_LIMITS.ip.limit;
    for (let i = 0; i < ipLimit; i++) {
      const r = enforceAiHttpRateLimits('9.9.9.9', `u-${i}`, now + i);
      assert.equal(r.ok, true);
    }
    const blocked = enforceAiHttpRateLimits('9.9.9.9', 'u-extra', now + ipLimit);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.scope, 'ip');
  });
});
