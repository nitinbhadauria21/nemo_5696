'use client';

import React, { useEffect, useState } from 'react';
import { CATEGORIES } from '@/lib/mockData';

export default function NichesTab() {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.profile?.niches)) setSelected(d.profile.niches);
      })
      .catch(() => {});
  }, []);

  const toggle = (niche: string) => {
    setSelected((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niches: selected }),
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Select niches to personalize your trend feed.</p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              selected.includes(cat)
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-flame px-4 py-2 rounded-xl text-sm"
      >
        {saving ? 'Saving…' : 'Save niches'}
      </button>
    </div>
  );
}
