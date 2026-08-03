'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function TrendFeedbackControl({ trendId }: { trendId: string }) {
  const [rating, setRating] = useState<'useful' | 'not_useful' | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (next: 'useful' | 'not_useful') => {
    setSaving(true);
    try {
      const res = await fetch(`/api/trends/${encodeURIComponent(trendId)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: next }),
      });
      if (res.status === 401) {
        toast.error('Sign in to leave feedback');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save feedback');
      }
      setRating(next);
      toast.success(next === 'useful' ? 'Marked useful' : 'Marked not useful');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <span className="text-xs font-sans text-muted-foreground mr-1">Was this helpful?</span>
      <button
        type="button"
        disabled={saving}
        onClick={() => submit('useful')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-sans font-semibold transition-colors ${
          rating === 'useful'
            ? 'bg-accent/15 text-accent'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        <ThumbsUp size={14} />
        Useful
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => submit('not_useful')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-sans font-semibold transition-colors ${
          rating === 'not_useful'
            ? 'bg-red-500/15 text-red-600'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        <ThumbsDown size={14} />
        Not useful
      </button>
    </div>
  );
}
