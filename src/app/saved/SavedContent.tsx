'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import TrendCard from '@/app/components/TrendCard';
import type { TrendItem } from '@/lib/mockData';
import { toast } from 'sonner';

export default function SavedContent() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [savedRes, trendsRes] = await Promise.all([
        fetch('/api/saved'),
        fetch('/api/trends?timeframe=168h&pageSize=100'),
      ]);
      const savedData = await savedRes.json();
      const trendsData = await trendsRes.json();
      const ids = new Set((savedData.saved || []).map((s: { trend_id: string }) => s.trend_id));
      const bookmarked = (trendsData.trends || [])
        .filter((t: TrendItem) => ids.has(t.id))
        .map((t: TrendItem) => ({ ...t, isBookmarked: true }));

      // Also merge bookmark API ids
      const bm = await fetch('/api/bookmarks')
        .then((r) => r.json())
        .catch(() => ({ bookmarks: [] }));
      const bmIds = new Set((bm.bookmarks || []) as string[]);
      const merged = (trendsData.trends || [])
        .filter((t: TrendItem) => ids.has(t.id) || bmIds.has(t.id))
        .map((t: TrendItem) => ({ ...t, isBookmarked: true }));

      setTrends(merged.length ? merged : bookmarked);
    } catch {
      toast.error('Could not load saved trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unsave = async (id: string) => {
    setTrends((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/saved/${id}`, { method: 'DELETE' });
    await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' }).catch(() => {});
    toast.success('Removed from saved');
  };

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 max-w-screen-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">Saved</h1>
      <p className="text-foreground/60 mb-5">
        Your bookmarked trends — share, alert, or open history.
      </p>
      {loading && <p className="py-10 text-center text-foreground/60">Loading…</p>}
      {!loading && trends.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-semibold text-lg mb-2">No saved trends yet</p>
          <Link href="/dashboard" className="text-primary font-semibold">
            Browse dashboard →
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {trends.map((t) => (
          <div key={t.id} className="flex flex-col gap-2">
            <TrendCard trend={t} onBookmarkToggle={unsave} />
            <div className="flex gap-2 text-sm px-1">
              <Link href={`/trend/${t.id}`} className="text-primary font-semibold">
                History
              </Link>
              <Link href="/alerts" className="text-foreground/60 font-semibold">
                Create alert
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
