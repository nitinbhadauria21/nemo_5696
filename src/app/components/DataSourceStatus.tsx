'use client';

import React, { useEffect, useState } from 'react';

type Source = {
  platform: string;
  displayName?: string;
  status: string;
  metricMode?: string;
  notes?: string;
};

export default function DataSourceStatus({ compact = false }: { compact?: boolean }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    fetch('/api/data-sources/status')
      .then((r) => r.json())
      .then((d) => {
        setSources(d.sources || []);
        setDemo(Boolean(d.demo));
      })
      .catch(() => {});
  }, []);

  if (!sources.length && !demo) return null;

  return (
    <div className={compact ? '' : 'card-surface p-3'}>
      {demo && (
        <div className="mb-2 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-200 px-3 py-2 text-sm font-semibold">
          Demo mode — sample data labeled; not live production metrics
        </div>
      )}
      <ul className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <li
            key={s.platform}
            className="text-xs px-2 py-1 rounded-md border border-border bg-muted/50"
            title={s.notes || ''}
          >
            <span className="font-semibold">{s.displayName || s.platform}</span>{' '}
            <span className="text-foreground/55">{s.status}</span>
            {s.metricMode && s.metricMode !== 'available' && (
              <span className="text-amber-700 dark:text-amber-300"> · {s.metricMode}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
