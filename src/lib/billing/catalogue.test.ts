import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BILLING_CATALOGUE, resolveSku } from './catalogue';

describe('resolveSku', () => {
  it('returns catalogue entry and ignores any client-supplied amount', () => {
    const entry = resolveSku('pro', 'monthly');
    assert.ok(entry);
    assert.equal(entry.sku, 'pro_monthly');
    assert.equal(entry.amountInr, BILLING_CATALOGUE.pro_monthly.amountInr);
    // Catalogue owns prices — client cannot override via resolveSku args
    assert.equal(entry.amountInr, 999);
    assert.notEqual(entry.amountInr, 1);
  });

  it('maps annual to yearly', () => {
    const entry = resolveSku('pro', 'annual');
    assert.ok(entry);
    assert.equal(entry.sku, 'pro_yearly');
    assert.equal(entry.billing, 'yearly');
    assert.equal(entry.amountInr, BILLING_CATALOGUE.pro_yearly.amountInr);
  });

  it('rejects invalid plan', () => {
    assert.equal(resolveSku('enterprise', 'monthly'), null);
    assert.equal(resolveSku('pro', 'weekly'), null);
    assert.equal(resolveSku('free', 'monthly'), null);
  });
});
