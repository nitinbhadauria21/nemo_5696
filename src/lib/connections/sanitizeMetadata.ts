const SENSITIVE_META_KEYS =
  /^(access_token|refresh_token|id_token|token|secret|password|api[_-]?key|authorization|bearer)$/i;

/**
 * Strip credential-like keys from `user_connections.metadata` before returning to clients.
 * OAuth callback currently stores only `{ connected, connected_at, token_status }` —
 * this is defense-in-depth if a future writer stores raw tokens.
 */
export function sanitizeConnectionMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_META_KEYS.test(key)) continue;
    if (typeof value === 'string' && /bearer\s+/i.test(value)) {
      out[key] = '[redacted]';
      continue;
    }
    out[key] = value;
  }
  return out;
}
