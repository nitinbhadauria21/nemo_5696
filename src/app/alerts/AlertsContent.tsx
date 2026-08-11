'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BRIEF_NICHES } from '@/lib/mockData';
import { toast } from 'sonner';

type Rule = {
  id: string;
  name: string;
  niche: string | null;
  min_score: number;
  lifecycle_status: string | null;
  require_cross_platform: boolean;
  require_breakout: boolean;
  enabled: boolean;
  notify_browser: boolean;
};

type AlertRow = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  trend_id: string | null;
};

export default function AlertsContent() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [name, setName] = useState('Score alert');
  const [niche, setNiche] = useState('');
  const [minScore, setMinScore] = useState(60);
  const [requireBreakout, setRequireBreakout] = useState(false);
  const [requireCross, setRequireCross] = useState(false);
  const [notifyBrowser, setNotifyBrowser] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/alerts');
    const data = await res.json();
    const nextAlerts: AlertRow[] = data.alerts || [];
    setRules(data.rules || []);
    setAlerts(nextAlerts);

    // In-app browser notify for newly arrived unread alerts (no email claim)
    if (
      primed.current &&
      notifyBrowser &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      for (const a of nextAlerts) {
        if (a.read || seenIds.current.has(a.id)) continue;
        try {
          new Notification(a.title, { body: a.body || 'New trend alert', tag: a.id });
        } catch {
          // ignore
        }
      }
    }
    for (const a of nextAlerts) seenIds.current.add(a.id);
    primed.current = true;
  }, [notifyBrowser]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const requestNotify = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications not supported');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifyBrowser(true);
      toast.success('Browser notifications enabled for this session');
    } else {
      toast.message('Notification permission denied');
    }
  };

  const createRule = async () => {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        niche: niche || null,
        minScore,
        requireBreakout,
        requireCrossPlatform: requireCross,
        notifyBrowser,
      }),
    });
    if (!res.ok) {
      toast.error('Could not create alert (sign in required)');
      return;
    }
    toast.success('Alert rule created');
    setName('Score alert');
    load();
  };

  const removeRule = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    load();
  };

  const markRead = async (id: string) => {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, markRead: true }),
    });
    load();
  };

  const unread = alerts.filter((a) => !a.read);

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">Alerts</h1>
      <p className="text-foreground/60 mb-5">
        Rules evaluate after each ingest. In-app list plus optional browser notifications — not
        email delivery.
      </p>

      <div className="card-surface p-4 space-y-3 mb-6">
        <h2 className="font-semibold">New rule</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-input border border-border rounded-lg px-3 py-2"
          placeholder="Rule name"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="bg-input border border-border rounded-lg px-3 py-2"
          >
            <option value="">Any niche</option>
            {BRIEF_NICHES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            Min score
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-20 bg-input border border-border rounded-lg px-2 py-1"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requireBreakout}
            onChange={(e) => setRequireBreakout(e.target.checked)}
          />
          Breakout only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requireCross}
            onChange={(e) => setRequireCross(e.target.checked)}
          />
          Require cross-platform
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={requestNotify}
            className="px-3 py-2 rounded-lg border border-border text-sm"
          >
            Enable browser notifications
          </button>
          <button
            type="button"
            onClick={createRule}
            className="btn-flame px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Create rule
          </button>
        </div>
      </div>

      <h2 className="font-semibold mb-2">Your rules</h2>
      <ul className="space-y-2 mb-8">
        {rules.length === 0 && <li className="text-foreground/55 text-sm">No rules yet.</li>}
        {rules.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between border border-border rounded-xl px-3 py-2"
          >
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-foreground/55">
                {r.niche || 'Any niche'} · score ≥ {r.min_score}
                {r.require_breakout ? ' · breakout' : ''}
                {r.require_cross_platform ? ' · cross-platform' : ''}
              </p>
            </div>
            <button type="button" onClick={() => removeRule(r.id)} className="text-sm text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>

      <h2 className="font-semibold mb-2">
        In-app alerts {unread.length > 0 ? `(${unread.length} unread)` : ''}
      </h2>
      <ul className="space-y-2">
        {alerts.length === 0 && <li className="text-foreground/55 text-sm">No alerts yet.</li>}
        {alerts.map((a) => (
          <li
            key={a.id}
            className={`border rounded-xl px-3 py-2 ${a.read ? 'border-border opacity-70' : 'border-primary/40'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{a.title}</p>
                {a.body && <p className="text-sm text-foreground/60">{a.body}</p>}
                <p className="text-xs text-foreground/45 mt-1">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              {!a.read && (
                <button
                  type="button"
                  onClick={() => markRead(a.id)}
                  className="text-xs font-semibold text-primary shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
