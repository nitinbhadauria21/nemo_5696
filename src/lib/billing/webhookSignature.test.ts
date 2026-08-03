import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyRazorpayWebhookEvent,
  computeRazorpaySignature,
  verifyRazorpaySignature,
} from './webhookSignature';

describe('verifyRazorpaySignature', () => {
  const secret = 'whsec_test_secret';
  const body = JSON.stringify({ event: 'payment.captured', id: 'evt_1' });

  it('accepts a valid HMAC signature', () => {
    const sig = computeRazorpaySignature(body, secret);
    assert.equal(verifyRazorpaySignature(body, sig, secret), true);
  });

  it('rejects tampered body or signature', () => {
    const sig = computeRazorpaySignature(body, secret);
    assert.equal(verifyRazorpaySignature(body + 'x', sig, secret), false);
    assert.equal(verifyRazorpaySignature(body, sig.slice(0, -2) + 'ff', secret), false);
    assert.equal(verifyRazorpaySignature(body, null, secret), false);
    assert.equal(verifyRazorpaySignature(body, sig, ''), false);
  });
});

describe('classifyRazorpayWebhookEvent', () => {
  it('maps known Razorpay events', () => {
    assert.equal(classifyRazorpayWebhookEvent('payment.captured'), 'success');
    assert.equal(classifyRazorpayWebhookEvent('order.paid'), 'success');
    assert.equal(classifyRazorpayWebhookEvent('payment.failed'), 'downgrade');
    assert.equal(classifyRazorpayWebhookEvent('refund.processed'), 'downgrade');
    assert.equal(classifyRazorpayWebhookEvent('subscription.charged'), 'other');
  });
});
