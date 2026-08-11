import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'crypto';

const ALGO = 'aes-256-gcm';

function resolveKeyMaterial(): Buffer {
  const raw =
    process.env.CONNECTIONS_ENCRYPTION_KEY?.trim() ||
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY?.trim() ||
    '';
  if (raw) {
    // Accept 64-char hex or any passphrase (scrypt-derived)
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
    return scryptSync(raw, 'nemo-connections-v1', 32);
  }
  // Dev fallback only — production must set CONNECTIONS_ENCRYPTION_KEY
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    throw new Error(
      'CONNECTIONS_ENCRYPTION_KEY is required to store OAuth tokens. Add a 32-byte secret (64 hex chars) on Vercel.'
    );
  }
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY || 'nemo-local-dev-only';
  return createHash('sha256').update(`nemo-dev:${fallback}`).digest();
}

export type SealedTokens = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  raw?: Record<string, unknown>;
};

/** Seal OAuth tokens for DB storage. Output is base64url: iv.ciphertext.tag */
export function sealTokens(payload: SealedTokens): string {
  const key = resolveKeyMaterial();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), enc.toString('base64url'), tag.toString('base64url')].join('.');
}

export function unsealTokens(sealed: string): SealedTokens {
  const key = resolveKeyMaterial();
  const [ivB64, dataB64, tagB64] = sealed.split('.');
  if (!ivB64 || !dataB64 || !tagB64) throw new Error('Invalid sealed token format');
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return JSON.parse(dec.toString('utf8')) as SealedTokens;
}

export function canSealConnectionTokens(): boolean {
  try {
    resolveKeyMaterial();
    return true;
  } catch {
    return false;
  }
}
