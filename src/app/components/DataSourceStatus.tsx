'use client';

import React, { useEffect, useState } from 'react';
import { userFacingPlatformStatus } from '@/lib/trends/publicCopy';

type Source = {
  platform: string;
  displayName?: string;
  status: string;
  metricMode?: string;
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
          Demo mode — showing sample trends, not live signals
        </div>
      )}
      <ul className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <li
            key={s.platform}
            className="text-xs px-2 py-1 rounded-md border border-border bg-muted/50"
          >
            <span className="font-semibold">{s.displayName || s.platform}</span>{' '}
            <span className="text-foreground/55">
              {(s as { label?: string }).label || userFacingPlatformStatus(s.status)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
