import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrendItem } from '@/lib/mockData';

type AlertRule = {
  id: string;
  user_id: string;
  name: string;
  niche: string | null;
  min_score: number | null;
  lifecycle_status: string | null;
  require_cross_platform: boolean | null;
  require_breakout: boolean | null;
  platforms: string[] | null;
  enabled: boolean | null;
  notify_browser: boolean | null;
};

function nicheMatch(trend: TrendItem, niche: string | null): boolean {
  if (!niche) return true;
  const want = niche.toLowerCase();
  const hay = [trend.category, ...(trend.niches || [])].map((n) => String(n).toLowerCase());
  return hay.some((n) => n === want || n.includes(want) || want.includes(n));
}

function ruleMatches(rule: AlertRule, trend: TrendItem): boolean {
  if (rule.enabled === false) return false;
  if (!nicheMatch(trend, rule.niche)) return false;
  const min = Number(rule.min_score ?? 60);
  if (trend.nemoScore < min) return false;
  if (rule.lifecycle_status) {
    const lc = (trend.lifecycle || trend.status || '').toLowerCase();
    if (lc !== String(rule.lifecycle_status).toLowerCase()) return false;
  }
  if (rule.require_cross_platform && (trend.platforms?.length || 0) < 2) return false;
  if (rule.require_breakout && !(trend.breakoutBoolean || (trend.breakoutScore ?? 0) >= 70)) {
    return false;
  }
  const plats = rule.platforms || [];
  if (plats.length) {
    const set = new Set((trend.platforms || []).map((p) => String(p).toLowerCase()));
    if (!plats.some((p) => set.has(String(p).toLowerCase()))) return false;
  }
  return true;
}

/**
 * Evaluate enabled alert rules against the latest ingest batch.
 * Inserts in-app alert rows; skips duplicates for the same rule+trend in 24h.
 */
export async function evaluateAlertRules(
  supabase: SupabaseClient,
  trends: TrendItem[]
): Promise<{ created: number }> {
  if (!trends.length) return { created: 0 };

  const { data: rules, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true)
    .limit(500);

  if (error || !rules?.length) return { created: 0 };

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await supabase
    .from('alerts')
    .select('rule_id, trend_id')
    .gte('created_at', since)
    .limit(2000);

  const seen = new Set((recent || []).map((r) => `${r.rule_id || ''}:${r.trend_id || ''}`));

  const inserts: Array<{
    user_id: string;
    rule_id: string;
    trend_id: string;
    title: string;
    body: string;
    read: boolean;
  }> = [];

  for (const rule of rules as AlertRule[]) {
    for (const trend of trends) {
      if (!ruleMatches(rule, trend)) continue;
      const key = `${rule.id}:${trend.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      inserts.push({
        user_id: rule.user_id,
        rule_id: rule.id,
        trend_id: trend.id,
        title: `${rule.name}: ${trend.title}`,
        body: `Score ${Math.round(trend.nemoScore)} · ${trend.lifecycle || trend.status} · ${(trend.platforms || []).join(', ')}`,
        read: false,
      });
    }
  }

  if (!inserts.length) return { created: 0 };

  // Batch insert in chunks
  let created = 0;
  for (let i = 0; i < inserts.length; i += 100) {
    const chunk = inserts.slice(i, i + 100);
    const { error: insErr } = await supabase.from('alerts').insert(chunk);
    if (!insErr) created += chunk.length;
    else console.error('alert insert failed', insErr.message);
  }

  return { created };
}
