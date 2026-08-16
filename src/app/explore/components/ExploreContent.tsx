'use client';

import React, { useCallback, useEffect, useState } from 'react';
import TrendCard from '@/app/components/TrendCard';
import type { TrendItem } from '@/lib/mockData';
import { CATEGORIES, PLATFORMS } from '@/lib/mockData';

const SORTS = [
  { id: 'score', label: 'Score' },
  { id: 'freshness', label: 'Freshness' },
  { id: 'velocity', label: 'Velocity' },
  { id: 'acceleration', label: 'Acceleration' },
  { id: 'recent', label: 'Recent' },
  { id: 'rising', label: 'Cross / Rising' },
] as const;

export default function ExploreContent() {
  const [niche, setNiche] = useState('All');
  const [platform, setPlatform] = useState('');
  const [sortBy, setSortBy] = useState<(typeof SORTS)[number]['id']>('score');
  const [timeframe, setTimeframe] = useState('24h');
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        timeframe,
        sortBy,
        page: String(page),
        pageSize: '24',
      });
      if (niche !== 'All') params.set('niche', niche);
      if (platform) params.set('platforms', platform);
      const res = await fetch(`/api/trends?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setTrends(data.trends || []);
      setTotal(data.total || 0);
    } catch {
      setError('Could not load trends. Try again.');
    } finally {
      setLoading(false);
    }
  }, [niche, platform, sortBy, timeframe, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-foreground mb-1">Explore</h1>
      <p className="text-foreground/60 mb-5">Browse trends by niche and platform.</p>

      <div className="card-surface p-4 mb-5 space-y-3">
        <p className="text-sm font-mono-custom uppercase tracking-widest text-foreground/60 font-bold">
          Browse by Niche
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setNiche(c);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                niche === c
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-foreground/70'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPage(1);
            }}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={timeframe}
            onChange={(e) => {
              setTimeframe(e.target.value);
              setPage(1);
            }}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="24h">24h</option>
            <option value="48h">48h</option>
            <option value="72h">72h</option>
          </select>
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSortBy(s.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${
                sortBy === s.id
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-foreground/70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-foreground/60">Loading…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && trends.length === 0 && (
        <p className="text-foreground/60">
          {niche !== 'All'
            ? `No active trends for ${niche} in the last ${timeframe}. Try a wider window.`
            : 'No trends match these filters.'}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {trends.map((t) => (
          <TrendCard key={t.id} trend={t} />
        ))}
      </div>

      {total > 24 && (
        <div className="flex justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border border-border disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-foreground/60 self-center">
            Page {page} · {total} trends
          </span>
          <button
            type="button"
            disabled={page * 24 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
