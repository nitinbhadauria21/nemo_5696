import { createAdminClient } from '@/lib/supabase/admin';

const HEARTBEAT_MS = 30_000;

function guessBrowser(ua: string | null): string | null {
  if (!ua) return null;
  const lower = ua.toLowerCase();
  if (lower.includes('edg/')) return 'Edge';
  if (lower.includes('chrome')) return 'Chrome';
  if (lower.includes('firefox')) return 'Firefox';
  if (lower.includes('safari')) return 'Safari';
  return 'Other';
}

function guessOs(ua: string | null): string | null {
  if (!ua) return null;
  const lower = ua.toLowerCase();
  if (lower.includes('windows')) return 'Windows';
  if (lower.includes('mac os') || lower.includes('macintosh')) return 'macOS';
  if (lower.includes('android')) return 'Android';
  if (lower.includes('iphone') || lower.includes('ipad')) return 'iOS';
  if (lower.includes('linux')) return 'Linux';
  return 'Other';
}

/**
 * Increment session active_ms by heartbeat interval while tab was visible.
 * Also refreshes last_seen_at / last_active_at / optional entry/exit paths.
 */
export async function heartbeatSession(opts: {
  sessionId: string;
  userId?: string | null;
  userAgent?: string | null;
  pagePath?: string | null;
  activeMsDelta?: number;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin || !opts.sessionId) return;

    const now = new Date().toISOString();
    const delta = Math.max(0, Math.min(opts.activeMsDelta ?? HEARTBEAT_MS, HEARTBEAT_MS * 2));
    const ua = opts.userAgent ?? null;

    const { data: existing } = await admin
      .from('user_sessions')
      .select('id, active_ms, entry_path, page_count')
      .eq('id', opts.sessionId)
      .maybeSingle();

    if (existing) {
      const updates: Record<string, unknown> = {
        last_seen_at: now,
        active_ms: (existing.active_ms ?? 0) + delta,
        user_agent: ua,
        browser: guessBrowser(ua),
        os: guessOs(ua),
        exit_path: opts.pagePath ?? null,
      };
      if (opts.userId) updates.user_id = opts.userId;
      if (!existing.entry_path && opts.pagePath) updates.entry_path = opts.pagePath;

      const { error } = await admin.from('user_sessions').update(updates).eq('id', opts.sessionId);
      if (error) console.error('[analytics] heartbeatSession update failed', error.message);
    } else {
      const { error } = await admin.from('user_sessions').insert({
        id: opts.sessionId,
        user_id: opts.userId || null,
        started_at: now,
        last_seen_at: now,
        active_ms: delta,
        page_count: 0,
        entry_path: opts.pagePath ?? null,
        exit_path: opts.pagePath ?? null,
        browser: guessBrowser(ua),
        os: guessOs(ua),
        user_agent: ua,
      });
      if (error) console.error('[analytics] heartbeatSession insert failed', error.message);
    }

    if (opts.userId) {
      await admin
        .from('profiles')
        .update({ last_active_at: now, updated_at: now })
        .eq('id', opts.userId);

      // Lightweight summary touch
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: sessions7 }, { data: sessions30 }] = await Promise.all([
        admin
          .from('user_sessions')
          .select('active_ms')
          .eq('user_id', opts.userId)
          .gte('last_seen_at', since7d),
        admin
          .from('user_sessions')
          .select('active_ms, id')
          .eq('user_id', opts.userId)
          .gte('last_seen_at', since30d),
      ]);

      const activeMs7d = (sessions7 ?? []).reduce((s, r) => s + Number(r.active_ms ?? 0), 0);
      const activeMs30d = (sessions30 ?? []).reduce((s, r) => s + Number(r.active_ms ?? 0), 0);

      await admin.from('user_activity_summary').upsert(
        {
          user_id: opts.userId,
          last_active_at: now,
          active_ms_7d: activeMs7d,
          active_ms_30d: activeMs30d,
          session_count_30d: (sessions30 ?? []).length,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      );
    }
  } catch (err) {
    console.error('[analytics] heartbeatSession error', err);
  }
}

/** Sync profiles.last_login_at from auth last_sign_in_at (service role). */
export async function syncLastLoginAt(userId: string, lastSignInAt?: string | null): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin || !userId) return;
    const ts = lastSignInAt || new Date().toISOString();
    await admin
      .from('profiles')
      .update({ last_login_at: ts, last_active_at: ts, updated_at: new Date().toISOString() })
      .eq('id', userId);
    await admin.from('user_activity_summary').upsert(
      {
        user_id: userId,
        last_login_at: ts,
        last_active_at: ts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    console.error('[analytics] syncLastLoginAt error', err);
  }
}
