'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { TrendItem } from '@/lib/mockData';
import TrendStatusBadge from '@/app/components/TrendStatusBadge';

export default function HistoryContent() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trends?timeframe=168h&pageSize=60&sortBy=recent')
      .then((r) => r.json())
      .then((d) => setTrends(d.trends || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 max-w-screen-xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">History</h1>
      <p className="text-foreground/60 mb-5">
        First detected, peak score, duration, platforms, and lifecycle.
      </p>
      {loading && <p className="text-foreground/60 py-10 text-center">Loading…</p>}
      <div className="overflow-x-auto border border-border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Trend</th>
              <th className="px-3 py-2.5 font-semibold">Lifecycle</th>
              <th className="px-3 py-2.5 font-semibold">Score</th>
              <th className="px-3 py-2.5 font-semibold">Peak vel</th>
              <th className="px-3 py-2.5 font-semibold">Accel</th>
              <th className="px-3 py-2.5 font-semibold">First seen</th>
              <th className="px-3 py-2.5 font-semibold">Platforms</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((t) => {
              const ageH = (Date.now() - Date.parse(t.firstDetectedAt || '')) / 3600000;
              return (
                <tr key={t.id} className="border-t border-border/70 hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/trend/${t.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.title}
                    </Link>
                    <div className="text-xs text-foreground/50">{t.category}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <TrendStatusBadge lifecycle={t.lifecycle} fallback={t.status} />
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{Math.round(t.nemoScore)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{t.velocity.toFixed(2)}x</td>
                  <td className="px-3 py-2.5 tabular-nums">{(t.acceleration ?? 0).toFixed(1)}</td>
                  <td className="px-3 py-2.5">
                    {t.firstDetectedAt ? new Date(t.firstDetectedAt).toLocaleString() : '—'}
                    <div className="text-xs text-foreground/45">
                      ~{Math.max(0, ageH).toFixed(0)}h duration
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{t.platforms.join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && trends.length === 0 && (
          <p className="p-8 text-center text-foreground/55">No history in the last 7 days.</p>
        )}
      </div>
    </div>
  );
}
