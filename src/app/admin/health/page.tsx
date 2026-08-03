'use client';

import React, { useEffect, useState } from 'react';

type Check = { id: string; name: string; status: string; detail: string };

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [checkedAt, setCheckedAt] = useState('');

  useEffect(() => {
    fetch('/api/admin/health')
      .then((r) => r.json())
      .then((d) => {
        setChecks(d.checks ?? []);
        setCheckedAt(d.checkedAt ?? '');
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="admin-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold">System health</h2>
          <span className="text-xs text-[var(--admin-mute)]">
            {checkedAt ? `Checked ${new Date(checkedAt).toLocaleTimeString()}` : '…'}
          </span>
        </div>
        <div className="space-y-3">
          {checks.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-b border-[var(--admin-line)] py-2 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    c.status === 'operational'
                      ? 'bg-[var(--admin-ok)]'
                      : c.status === 'degraded'
                        ? 'bg-[var(--admin-warn)]'
                        : 'bg-[var(--admin-bad)]'
                  }`}
                />
                <span className="text-sm font-medium">{c.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-[var(--admin-mute)]">{c.detail}</span>
                <span
                  className={`font-mono uppercase ${
                    c.status === 'operational'
                      ? 'admin-health-ok'
                      : c.status === 'degraded'
                        ? 'admin-health-warn'
                        : 'admin-health-bad'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card p-5">
        <h2 className="mb-2 font-display text-sm font-bold">Cron ingestion</h2>
        <p className="text-sm text-[var(--admin-soft)]">
          Schedule{' '}
          <code className="rounded bg-[var(--admin-surface-2)] px-1.5 py-0.5 font-mono text-xs">
            POST /api/trends
          </code>{' '}
          with header{' '}
          <code className="rounded bg-[var(--admin-surface-2)] px-1.5 py-0.5 font-mono text-xs">
            x-cron-secret
          </code>{' '}
          every 15–30 minutes.
        </p>
      </div>
    </div>
  );
}
