import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeConnectionMetadata } from './sanitizeMetadata';

describe('sanitizeConnectionMetadata', () => {
  it('keeps status flags and strips credential keys', () => {
    const out = sanitizeConnectionMetadata({
      connected: true,
      connected_at: '2026-01-01T00:00:00.000Z',
      token_status: 'active',
      access_token: 'secret-tok',
      refresh_token: 'refresh-tok',
      api_key: 'k',
    });
    assert.equal(out.connected, true);
    assert.equal(out.token_status, 'active');
    assert.equal('access_token' in out, false);
    assert.equal('refresh_token' in out, false);
    assert.equal('api_key' in out, false);
  });

  it('redacts bearer-like string values', () => {
    const out = sanitizeConnectionMetadata({ note: 'Bearer abc.def' });
    assert.equal(out.note, '[redacted]');
  });
});
