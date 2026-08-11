/**
 * Startup / admin health env validation (no secrets logged).
 */

const CRITICAL = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'CRON_SECRET',
] as const;

const RECOMMENDED = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAIL',
  'YOUTUBE_API_KEY',
  'SCRAPECREATORS_API_KEY',
  'OPENROUTER_API_KEY',
] as const;

export function validateEnv(env: NodeJS.ProcessEnv = process.env): {
  ok: boolean;
  missingCritical: string[];
  missingRecommended: string[];
} {
  const missingCritical = CRITICAL.filter((k) => !env[k]?.trim());
  const missingRecommended = RECOMMENDED.filter((k) => !env[k]?.trim());
  return {
    ok: missingCritical.length === 0,
    missingCritical,
    missingRecommended,
  };
}

export function logEnvValidationOnce() {
  if (typeof globalThis === 'undefined') return;
  const g = globalThis as { __nemoEnvValidated?: boolean };
  if (g.__nemoEnvValidated) return;
  g.__nemoEnvValidated = true;
  const result = validateEnv();
  if (!result.ok) {
    console.warn('[nemo] Missing critical env (names only):', result.missingCritical.join(', '));
  }
  if (result.missingRecommended.length) {
    console.info('[nemo] Optional env not set:', result.missingRecommended.join(', '));
  }
}
