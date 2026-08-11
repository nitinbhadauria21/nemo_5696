'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DEFAULT_BRIEF_WEIGHTS, type BriefWeights } from '@/lib/signals/briefScoring';

const PROVIDERS = [
  'youtube',
  'instagram',
  'tiktok',
  'reddit',
  'google_trends',
  'twitter',
  'facebook',
  'linkedin',
] as const;

type ProviderRow = {
  platform: string;
  enabled: boolean;
  poll_interval_minutes: number;
  status: string;
  records_last_run?: number;
};

const WEIGHT_KEYS: Array<keyof BriefWeights> = [
  'freshness',
  'velocity',
  'acceleration',
  'cross_platform',
  'engagement',
  'novelty',
  'creator',
  'persistence',
  'breakout_modifier',
  'geo_spread_modifier',
];

export default function AdminPlatformsPage() {
  const [weights, setWeights] = useState<BriefWeights>({ ...DEFAULT_BRIEF_WEIGHTS });
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([
        fetch('/api/admin/refresh?action=get_weights'),
        fetch('/api/data-sources/status'),
      ]);
      if (wRes.ok) {
        const w = await wRes.json();
        if (w.weights) setWeights({ ...DEFAULT_BRIEF_WEIGHTS, ...w.weights });
      }
      if (sRes.ok) {
        const s = await sRes.json();
        const rows: ProviderRow[] = (s.sources || s.platforms || []).map(
          (p: Record<string, unknown>) => ({
            platform: String(p.platform || p.id || ''),
            enabled: p.enabled !== false,
            poll_interval_minutes: Number(p.poll_interval_minutes ?? p.pollIntervalMinutes ?? 30),
            status: String(p.status || p.health || 'unknown'),
            records_last_run: Number(p.records_last_run ?? p.recordsLastRun ?? 0),
          })
        );
        if (rows.length) setProviders(rows);
        else {
          setProviders(
            PROVIDERS.map((platform) => ({
              platform,
              enabled: true,
              poll_interval_minutes: 30,
              status: 'unknown',
            }))
          );
        }
      }
    } catch {
      toast.error('Could not load admin scoring controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const postAction = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      toast.success('Saved');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveWeights = () => postAction({ action: 'set_weights', weights });

  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <h2 className="font-display text-lg font-bold">Scoring weights</h2>
        <p className="mt-1 text-sm text-[var(--admin-mute)]">
          Server-side weights for brief scoring. Changes apply on next ingest / score pass.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-[var(--admin-mute)]">Loading…</p>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {WEIGHT_KEYS.map((key) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-mono text-[var(--admin-soft)]">{key}</span>
                <input
                  type="number"
                  step="0.01"
                  value={weights[key]}
                  onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))}
                  className="w-24 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-surface-2)] px-2 py-1.5 font-mono"
                />
              </label>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={saving || loading}
          onClick={saveWeights}
          className="mt-4 rounded-xl bg-[#FF5A1F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save weights
        </button>
      </div>

      <div className="admin-card p-6">
        <h2 className="font-display text-lg font-bold">Providers</h2>
        <p className="mt-1 text-sm text-[var(--admin-mute)]">
          Enable/disable collectors and set poll interval (minutes). Auth required on server.
        </p>
        <div className="mt-4 space-y-3">
          {providers.map((p) => (
            <div
              key={p.platform}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-line)] py-3 last:border-0"
            >
              <div>
                <div className="font-medium capitalize">{p.platform.replace('_', ' ')}</div>
                <div className="text-xs text-[var(--admin-mute)]">
                  {p.status}
                  {p.records_last_run != null ? ` · last run ${p.records_last_run}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs">
                  Poll
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={p.poll_interval_minutes}
                    onChange={(e) =>
                      setProviders((rows) =>
                        rows.map((r) =>
                          r.platform === p.platform
                            ? { ...r, poll_interval_minutes: Number(e.target.value) }
                            : r
                        )
                      )
                    }
                    className="w-16 rounded border border-[var(--admin-line)] bg-[var(--admin-surface-2)] px-1.5 py-1 font-mono"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    postAction({
                      action: 'set_poll_interval',
                      platform: p.platform,
                      minutes: p.poll_interval_minutes,
                    })
                  }
                  className="rounded-lg border border-[var(--admin-line)] px-2 py-1 text-xs"
                >
                  Set poll
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    postAction({
                      action: p.enabled ? 'disable_provider' : 'enable_provider',
                      platform: p.platform,
                    })
                  }
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    p.enabled
                      ? 'border border-[var(--admin-line)]'
                      : 'bg-[rgba(255,90,31,0.2)] text-[#FF6B2B]'
                  }`}
                >
                  {p.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
