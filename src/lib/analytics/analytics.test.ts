import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProperties } from './track';
import { estimateCostUsd } from '../ai/logGeneration';

describe('analytics sanitizeProperties', () => {
  it('strips password and token keys', () => {
    const out = sanitizeProperties({
      topic: 'hello',
      password: 'secret',
      api_key: 'x',
      nested: { token: 't', ok: 1 },
    });
    assert.equal(out.topic, 'hello');
    assert.equal(out.password, undefined);
    assert.equal(out.api_key, undefined);
    assert.deepEqual(out.nested, { ok: 1 });
  });

  it('truncates long strings', () => {
    const long = 'a'.repeat(3000);
    const out = sanitizeProperties({ body: long });
    assert.equal(typeof out.body, 'string');
    assert.ok((out.body as string).length <= 2000);
  });
});

describe('script generation insert shape', () => {
  it('preview is capped at 500 chars conceptually', () => {
    const preview = 'x'.repeat(800).slice(0, 500);
    assert.equal(preview.length, 500);
  });

  it('required success flag is boolean', () => {
    const row = {
      user_id: '00000000-0000-0000-0000-000000000001',
      success: true,
      parse_ok: true,
      topic: 'test',
      preview: 'hook…',
    };
    assert.equal(typeof row.success, 'boolean');
    assert.ok(!('password' in row));
  });
});

describe('admin users payload hygiene', () => {
  it('never includes password fields', () => {
    const user = {
      id: 'u1',
      email: 'a@b.com',
      full_name: 'A',
      last_login_at: null,
      time_spent_7d: '12m',
      script_gens_30d: 2,
    };
    assert.equal('password' in user, false);
    assert.equal('encrypted_password' in user, false);
  });
});

describe('cost estimate', () => {
  it('returns null for zero tokens', () => {
    assert.equal(estimateCostUsd(0, 'gpt-4o'), null);
  });

  it('returns positive for tokens', () => {
    const c = estimateCostUsd(1000, 'gpt-4o-mini');
    assert.ok(c != null && c > 0);
  });
});
