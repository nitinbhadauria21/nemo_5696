import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdminSession } from '@/lib/admin/auth';
import { resolveAiProvider } from '@/lib/ai/runPrompt';

export async function GET() {
  const adminAuth = await requireAdminSession();
  if (adminAuth !== true) return adminAuth;

  const checks: { id: string; name: string; status: string; detail: string }[] = [];

  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const t0 = Date.now();
      const { error } = await admin
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .limit(1);
      const latency = Date.now() - t0;
      checks.push({
        id: 'supabase',
        name: 'Supabase',
        status: error ? 'down' : 'operational',
        detail: error ? error.message : `${latency}ms`,
      });
    } else {
      checks.push({
        id: 'supabase',
        name: 'Supabase',
        status: 'down',
        detail: 'Admin client missing service role',
      });
    }
  } else {
    checks.push({
      id: 'supabase',
      name: 'Supabase',
      status: 'degraded',
      detail: 'Not configured',
    });
  }

  const youtube = Boolean(process.env.YOUTUBE_API_KEY);
  const googleProxy = Boolean(process.env.GOOGLE_TRENDS_PROXY_URL);
  const cron = Boolean(process.env.CRON_SECRET);
  const aiProvider = resolveAiProvider(process.env.AI_PROVIDER);
  const keyByProvider: Record<string, boolean> = {
    OPENROUTER: Boolean(process.env.OPENROUTER_API_KEY),
    ANTHROPIC: Boolean(process.env.ANTHROPIC_API_KEY),
    OPEN_AI: Boolean(process.env.OPENAI_API_KEY),
    GEMINI: Boolean(process.env.GEMINI_API_KEY),
    PERPLEXITY: Boolean(process.env.PERPLEXITY_API_KEY),
  };
  const aiKeyPresent = keyByProvider[aiProvider] || Object.values(keyByProvider).some(Boolean);

  checks.push({
    id: 'ai',
    name: 'AI provider',
    status: aiKeyPresent ? 'operational' : 'down',
    detail: aiKeyPresent
      ? `Key set (provider ${aiProvider})`
      : `Missing key for ${aiProvider} (set OPENROUTER_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY / PERPLEXITY_API_KEY)`,
  });

  checks.push({
    id: 'reddit',
    name: 'Reddit collector',
    status: 'operational',
    detail: 'Public JSON',
  });
  checks.push({
    id: 'youtube',
    name: 'YouTube collector',
    status: youtube ? 'operational' : 'degraded',
    detail: youtube ? 'API key set' : 'Missing YOUTUBE_API_KEY',
  });
  checks.push({
    id: 'google',
    name: 'Google Trends',
    status: googleProxy ? 'operational' : 'degraded',
    detail: googleProxy ? 'Proxy configured' : 'Seeds / no proxy',
  });
  checks.push({
    id: 'cron',
    name: 'Cron secret',
    status: cron ? 'operational' : 'degraded',
    detail: cron ? 'CRON_SECRET set' : 'Unset — protect /api/trends',
  });
  checks.push({
    id: 'api',
    name: 'Admin API',
    status: 'operational',
    detail: 'Session OK',
  });

  let collectorFreshnessHours: number | null = null;
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    if (admin) {
      const { data: lastRun } = await admin
        .from('collector_runs')
        .select('finished_at, created_at, source, error')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastRun) {
        const t = new Date(lastRun.finished_at || lastRun.created_at).getTime();
        collectorFreshnessHours = Math.round(((Date.now() - t) / 3600000) * 10) / 10;
        checks.push({
          id: 'collectors',
          name: 'Trend collectors',
          status: lastRun.error
            ? 'degraded'
            : collectorFreshnessHours != null && collectorFreshnessHours < 36
              ? 'operational'
              : 'degraded',
          detail: lastRun.error
            ? `Last error on ${lastRun.source}`
            : `Last run ${collectorFreshnessHours}h ago (${lastRun.source})`,
        });
      }
    }
  }

  return NextResponse.json({
    checks,
    checkedAt: new Date().toISOString(),
    collectorFreshnessHours,
  });
}
