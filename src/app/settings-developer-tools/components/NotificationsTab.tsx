'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const PREF_ROWS = [
  {
    key: 'email_digest' as const,
    label: 'Email digest',
    description: 'Weekly summary of your trends and activity',
  },
  {
    key: 'trend_alerts' as const,
    label: 'Trend alerts',
    description: 'Alert when topics in your niches heat up',
  },
  {
    key: 'product_updates' as const,
    label: 'Product updates',
    description: 'Occasional product and feature announcements',
  },
];

type Prefs = {
  email_digest: boolean;
  trend_alerts: boolean;
  product_updates: boolean;
};

const DEFAULT_PREFS: Prefs = {
  email_digest: true,
  trend_alerts: true,
  product_updates: false,
};

export default function NotificationsTab() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/notification-prefs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.prefs) setPrefs({ ...DEFAULT_PREFS, ...d.prefs });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      const res = await fetch('/api/user/notification-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      const data = await res.json();
      if (data.prefs) setPrefs({ ...DEFAULT_PREFS, ...data.prefs });
      toast.success(next[key] ? 'Notification enabled' : 'Notification disabled');
    } catch (e) {
      setPrefs(prefs);
      toast.error(e instanceof Error ? e.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-sans">
        Preferences are saved to your account. Email delivery can be wired later — storage is ready.
      </p>
      <div className="card-surface overflow-hidden">
        {PREF_ROWS.map((notif, idx) => (
          <div
            key={notif.key}
            className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${
              idx < PREF_ROWS.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-sans font-semibold text-foreground">{notif.label}</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">{notif.description}</p>
            </div>
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => toggle(notif.key)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50 ${
                prefs[notif.key] ? 'bg-primary' : 'bg-muted border border-border'
              }`}
              role="switch"
              aria-checked={prefs[notif.key]}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  prefs[notif.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
