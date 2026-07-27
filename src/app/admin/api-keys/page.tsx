'use client';

import React, { useCallback, useEffect, useState } from 'react';

type ApiKeyRow = {
  id: string;
  user_id: string;
  user_label?: string | null;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string | null;
};

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [source, setSource] = useState('…');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/api-keys')
      .then((r) => r.json())
      .then((d) => {
        setKeys(d.keys ?? []);
        setSource(d.source ?? 'unknown');
      })
      .catch(() => setKeys([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (id: string) => {
    if (!confirm('Revoke this API key?')) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-[var(--admin-mute)]">
        Platform-wide keys · prefixes only · source: {source}
      </p>

      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Name</th>
              <th>Prefix</th>
              <th>Created</th>
              <th>Last used</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td>
                  <div className="text-[var(--admin-text)]">{k.user_label || '—'}</div>
                  <div className="font-mono text-[10px] text-[var(--admin-mute)]">{k.user_id.slice(0, 8)}…</div>
                </td>
                <td>{k.name}</td>
                <td className="font-mono text-xs">{k.key_prefix}…</td>
                <td className="font-mono text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                <td className="font-mono text-xs">
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-btn text-xs"
                    disabled={busyId === k.id}
                    onClick={() => revoke(k.id)}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[var(--admin-mute)]">
                  No API keys issued
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
