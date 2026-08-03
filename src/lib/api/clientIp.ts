import type { NextRequest } from 'next/server';

/** Best-effort client IP from proxy headers (Vercel / Cloudflare). */
export function getClientIp(request?: NextRequest | Request | null): string {
  if (!request) return 'unknown';
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || 'unknown';
}
