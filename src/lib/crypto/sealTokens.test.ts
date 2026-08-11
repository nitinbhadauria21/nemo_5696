import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sealTokens, unsealTokens } from './sealTokens';

describe('sealTokens', () => {
  it('round-trips access and refresh tokens', () => {
    process.env.CONNECTIONS_ENCRYPTION_KEY = 'a'.repeat(64);
    const sealed = sealTokens({
      access_token: 'ya29.test-access',
      refresh_token: '1//refresh',
      expires_in: 3600,
    });
    assert.equal(sealed.includes('ya29'), false);
    const opened = unsealTokens(sealed);
    assert.equal(opened.access_token, 'ya29.test-access');
    assert.equal(opened.refresh_token, '1//refresh');
  });
});
