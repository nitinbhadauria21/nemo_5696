import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAdminCookie } from './auth';

describe('admin auth helpers', () => {
  it('never treats UX cookie as authorization', () => {
    const cookies = {
      get: (name: string) => (name === 'nemo_admin_session' ? { value: '1' } : undefined),
    };
    assert.equal(isAdminCookie(cookies), false);
  });
});
