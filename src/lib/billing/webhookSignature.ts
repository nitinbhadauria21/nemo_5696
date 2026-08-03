import { createHmac, timingSafeEqual } from 'crypto';

export const RAZORPAY_SUCCESS_EVENTS = new Set(['payment.captured', 'order.paid']);
export const RAZORPAY_DOWNGRADE_EVENTS = new Set([
  'payment.failed',
  'refund.created',
  'refund.processed',
]);

export type WebhookEventClass = 'success' | 'downgrade' | 'other';

export function classifyRazorpayWebhookEvent(eventType: string): WebhookEventClass {
  if (RAZORPAY_SUCCESS_EVENTS.has(eventType)) return 'success';
  if (RAZORPAY_DOWNGRADE_EVENTS.has(eventType)) return 'downgrade';
  return 'other';
}

/** HMAC-SHA256 hex digest of body with webhook secret (Razorpay). */
export function computeRazorpaySignature(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Constant-time compare of Razorpay `x-razorpay-signature` header vs expected HMAC.
 * Returns false when signature missing or length mismatch.
 */
export function verifyRazorpaySignature(
  body: string,
  signature: string | null | undefined,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const expected = computeRazorpaySignature(body, secret);
  try {
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
