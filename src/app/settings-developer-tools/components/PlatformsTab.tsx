'use client';

import React, { useEffect, useState } from 'react';
import { PLATFORMS, type TrendPlatform } from '@/lib/mockData';
import PlatformIcon, { PLATFORM_META } from '@/components/ui/PlatformIcon';

export default function PlatformsTab() {
  const [selected, setSelected] = useState<TrendPlatform[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.profile?.platforms)) setSelected(d.profile.platforms);
      })
      .catch(() => {});
  }, []);

  const toggle = (p: TrendPlatform) => {
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platforms: selected }),
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose which platforms appear in your dashboard filters and alerts.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {PLATFORMS.map((p) => {
          const active = selected.includes(p);
          const label = PLATFORM_META[p]?.label ?? p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold border text-left transition-colors flex items-center gap-3 ${
                active
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-foreground hover:border-primary/30'
              }`}
            >
              <PlatformIcon platform={p} size={18} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-flame px-4 py-2 rounded-xl text-sm"
      >
        {saving ? 'Saving…' : 'Save platforms'}
      </button>
    </div>
  );
}
