'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import TrendCard from '@/app/components/TrendCard';
import type { TrendItem } from '@/lib/mockData';
import { CATEGORIES, PLATFORMS } from '@/lib/mockData';
import { Search } from 'lucide-react';

const SORTS = [
  { id: 'score', label: 'Score' },
  { id: 'freshness', label: 'Freshness' },
  { id: 'velocity', label: 'Velocity' },
  { id: 'acceleration', label: 'Acceleration' },
  { id: 'recent', label: 'Recent' },
  { id: 'rising', label: 'Cross / Rising' },
] as const;

export default function ExploreContent() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [niche, setNiche] = useState('All');
  const [platform, setPlatform] = useState('');
  const [sortBy, setSortBy] = useState<(typeof SORTS)[number]['id']>('score');
  const [timeframe, setTimeframe] = useState('24h');
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

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
      if (debouncedQ) params.set('q', debouncedQ);
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
  }, [debouncedQ, niche, platform, sortBy, timeframe, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-foreground mb-1">Explore</h1>
      <p className="text-foreground/60 mb-5">Search trends, keywords, hashtags, and creators.</p>

      <div className="card-surface p-4 mb-5 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/45"
          />
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search title, keyword, hashtag…"
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2.5 text-base"
          />
        </div>
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
              onClick={() => setSortBy(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                sortBy === s.id ? 'bg-primary text-white' : 'bg-muted text-foreground/70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-foreground/60 py-10 text-center">Loading…</p>}
      {error && <p className="text-red-600 py-6 text-center">{error}</p>}
      {!loading && !error && trends.length === 0 && (
        <p className="text-foreground/60 py-10 text-center">No trends match these filters.</p>
      )}
      {!loading && trends.length > 0 && (
        <>
          <p className="text-sm text-foreground/55 mb-3">{total} results</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {trends.map((t) => (
              <TrendCard key={t.id} trend={t} />
            ))}
          </div>
          <div className="flex justify-center gap-3 mt-6">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-border disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-foreground/60">Page {page}</span>
            <button
              type="button"
              disabled={page * 24 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border border-border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
