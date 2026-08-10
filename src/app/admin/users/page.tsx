'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

type AdminUser = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  plan?: string | null;
  niches_count?: number;
  linked_socials_count?: number;
  last_event_at?: string | null;
  last_login_at?: string | null;
  last_active_at?: string | null;
  created_at?: string | null;
  onboarding_complete?: boolean | null;
  status?: string | null;
  time_spent_7d?: string;
  time_spent_30d?: string;
  script_gens_30d?: number;
  scripts_saved_30d?: number;
};

type Kpis = {
  totalUsers: number;
  payingUsers: number;
  freeUsers: number;
  incompleteOnboarding: number;
};

function planPill(plan?: string | null) {
  const p = (plan || 'free').toLowerCase();
  const cls =
    p === 'agency' ? 'admin-pill-agency' : p === 'pro' ? 'admin-pill-pro' : 'admin-pill-free';
  return <span className={`admin-pill ${cls}`}>{p}</span>;
}

export default function AdminUsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [kpis, setKpis] = useState<Kpis>({
    totalUsers: 0,
    payingUsers: 0,
    freeUsers: 0,
    incompleteOnboarding: 0,
  });
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('all');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('…');
  const [resetBusy, setResetBusy] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{
    email?: string | null;
    password: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (plan && plan !== 'all') params.set('plan', plan);
    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const d = await res.json();
      setUsers(d.users ?? []);
      if (d.kpis) setKpis(d.kpis);
      setSource(d.source ?? 'unknown');
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [q, plan]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const resetPassword = async (userId: string) => {
    if (!confirm('Generate a temporary password for this user? It will be shown once only.')) {
      return;
    }
    setResetBusy(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setTempPassword({ email: d.email, password: d.temporaryPassword });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {tempPassword && (
        <div className="admin-card border border-[#FF5A1F]/40 bg-[rgba(255,90,31,0.08)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold text-[var(--admin-text)]">
                Temporary password (shown once)
              </h3>
              <p className="mt-1 text-xs text-[var(--admin-mute)]">
                {tempPassword.email || 'User'} — copy now. Not stored in the database.
              </p>
              <code className="mt-2 block rounded-lg bg-[var(--admin-surface-2)] px-3 py-2 font-mono text-sm">
                {tempPassword.password}
              </code>
            </div>
            <button type="button" className="admin-btn" onClick={() => setTempPassword(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total', value: kpis.totalUsers },
          { label: 'Paying', value: kpis.payingUsers },
          { label: 'Free', value: kpis.freeUsers },
          { label: 'Incomplete onboarding', value: kpis.incompleteOnboarding },
        ].map((k) => (
          <div key={k.label} className="admin-kpi">
            <div className="admin-kpi-label">{k.label}</div>
            <div className="admin-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-mute)]"
          />
          <input
            className="admin-input pl-9"
            placeholder="Search name, email, id…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="admin-input w-auto"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        >
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
        </select>
        <span className="text-xs text-[var(--admin-mute)]">Source: {source}</span>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Plan</th>
                <th>Last login</th>
                <th>Time 7d / 30d</th>
                <th>Scripts 30d</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[var(--admin-mute)]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium text-[var(--admin-text)]">
                        {u.full_name || '—'}
                      </div>
                      <div className="text-xs text-[var(--admin-mute)]">{u.email}</div>
                    </td>
                    <td>{planPill(u.plan)}</td>
                    <td className="font-mono text-xs">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString()
                        : u.last_active_at
                          ? new Date(u.last_active_at).toLocaleString()
                          : '—'}
                    </td>
                    <td className="font-mono text-xs">
                      {u.time_spent_7d || '—'} / {u.time_spent_30d || '—'}
                    </td>
                    <td className="font-mono text-xs">
                      {u.script_gens_30d ?? 0} gen · {u.scripts_saved_30d ?? 0} saved
                    </td>
                    <td>
                      <span
                        className={`admin-pill ${
                          u.status === 'suspended' ? 'admin-pill-free' : 'admin-pill-agency'
                        }`}
                      >
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Link href={`/admin/users/${u.id}`} className="admin-btn text-xs">
                          View →
                        </Link>
                        <button
                          type="button"
                          className="admin-btn text-xs"
                          disabled={resetBusy === u.id}
                          onClick={() => resetPassword(u.id)}
                        >
                          {resetBusy === u.id ? '…' : 'Reset pw'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[var(--admin-mute)]">
                    No users match
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
