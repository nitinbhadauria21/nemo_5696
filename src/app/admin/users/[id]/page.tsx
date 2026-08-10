'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  plan?: string | null;
  niches?: string[] | null;
  platforms?: string[] | null;
  onboarding_complete?: boolean | null;
  connected_socials?: string[] | null;
  schedule?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  razorpay_customer_id?: string | null;
  razorpay_subscription_id?: string | null;
};

type Connection = {
  id: string;
  platform: string;
  connected_at: string;
  metadata?: Record<string, unknown> | null;
};

type UserEvent = {
  id: string;
  event_name: string;
  event_category: string | null;
  page_path: string | null;
  created_at: string;
};

function initials(name?: string | null, email?: string | null) {
  const s = (name || email || '?').trim();
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

function planPill(plan?: string | null) {
  const p = (plan || 'free').toLowerCase();
  const cls =
    p === 'agency' ? 'admin-pill-agency' : p === 'pro' ? 'admin-pill-pro' : 'admin-pill-free';
  return <span className={`admin-pill ${cls}`}>{p}</span>;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params.id || '');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [meta, setMeta] = useState<{
    eventCount: number;
    activityStatus: string;
    lastEventAt: string | null;
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [scripts, setScripts] = useState<
    { id: string; topic: string | null; success: boolean; created_at: string; viral_score: number | null }[]
  >([]);
  const [searches, setSearches] = useState<
    { id: string; query: string; result_count: number | null; created_at: string }[]
  >([]);
  const [carousels, setCarousels] = useState<
    { id: string; topic: string | null; exported: boolean; created_at: string }[]
  >([]);

  const load = () => {
    fetch(`/api/admin/users/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed');
        setProfile(d.profile);
        setConnections(d.connections ?? []);
        setEvents(d.events ?? []);
        setMeta(d.meta);
        setScripts(d.scripts ?? []);
        setSearches(d.searches ?? []);
        setCarousels(d.carousels ?? []);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleSuspend = async () => {
    if (!profile) return;
    const next = profile.status === 'suspended' ? 'active' : 'suspended';
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) load();
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!confirm('Generate a temporary password? It will be shown once only and is never stored.')) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setTempPassword(d.temporaryPassword);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-[var(--admin-mute)] hover:text-[var(--admin-text)]"
        >
          <ArrowLeft size={14} /> Users
        </Link>
        <p className="text-[var(--admin-bad)]">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-[var(--admin-mute)]">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-[var(--admin-mute)] hover:text-[var(--admin-text)]"
      >
        <ArrowLeft size={14} /> Users
      </Link>

      <div className="admin-card flex flex-wrap items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF3D0D] to-[#FF8A22] text-lg font-bold text-white">
          {initials(profile.full_name, profile.email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold">{profile.full_name || 'Unnamed'}</h2>
            {planPill(profile.plan)}
            <span
              className={`admin-pill ${
                meta?.activityStatus === 'active' ? 'admin-pill-agency' : 'admin-pill-free'
              }`}
            >
              {meta?.activityStatus === 'active' ? 'Active' : 'Idle'}
            </span>
            {profile.status === 'suspended' && (
              <span
                className="admin-pill"
                style={{ background: 'rgba(240,68,56,0.15)', color: '#f04438' }}
              >
                Suspended
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--admin-mute)]">{profile.email}</p>
          {(profile as Profile & { last_login_at?: string }).last_login_at && (
            <p className="mt-1 font-mono text-[10px] text-[var(--admin-mute)]">
              Last login:{' '}
              {new Date(
                (profile as Profile & { last_login_at?: string }).last_login_at!
              ).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-btn" onClick={toggleSuspend} disabled={busy}>
            {profile.status === 'suspended' ? 'Reactivate' : 'Suspend'}
          </button>
          <button type="button" className="admin-btn" onClick={resetPassword} disabled={busy}>
            Reset password
          </button>
        </div>
      </div>

      {tempPassword && (
        <div className="admin-card border border-[#FF5A1F]/40 p-4">
          <h3 className="font-display text-sm font-bold">Temporary password (once only)</h3>
          <p className="mt-1 text-xs text-[var(--admin-mute)]">
            Not stored in the database. Copy now.
          </p>
          <code className="mt-2 block rounded-lg bg-[var(--admin-surface-2)] px-3 py-2 font-mono text-sm">
            {tempPassword}
          </code>
          <button type="button" className="admin-btn mt-3 text-xs" onClick={() => setTempPassword(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card p-4 space-y-3">
          <h3 className="font-display text-sm font-bold">Account</h3>
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-[var(--admin-mute)]">User ID</dt>
            <dd className="font-mono text-xs break-all">{profile.id}</dd>
            <dt className="text-[var(--admin-mute)]">Joined</dt>
            <dd>{profile.created_at ? new Date(profile.created_at).toLocaleString() : '—'}</dd>
            <dt className="text-[var(--admin-mute)]">Onboarding</dt>
            <dd>{profile.onboarding_complete ? 'Complete' : 'Incomplete'}</dd>
            <dt className="text-[var(--admin-mute)]">Schedule</dt>
            <dd>{profile.schedule || '—'}</dd>
            <dt className="text-[var(--admin-mute)]">Niches</dt>
            <dd>{(profile.niches || []).join(', ') || '—'}</dd>
            <dt className="text-[var(--admin-mute)]">Platforms</dt>
            <dd>{(profile.platforms || []).join(', ') || '—'}</dd>
          </dl>
        </div>

        <div className="admin-card p-4 space-y-3">
          <h3 className="font-display text-sm font-bold">Billing</h3>
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-[var(--admin-mute)]">Plan</dt>
            <dd>{planPill(profile.plan)}</dd>
            <dt className="text-[var(--admin-mute)]">Razorpay customer</dt>
            <dd className="font-mono text-xs">{profile.razorpay_customer_id || '—'}</dd>
            <dt className="text-[var(--admin-mute)]">Subscription</dt>
            <dd className="font-mono text-xs">{profile.razorpay_subscription_id || '—'}</dd>
          </dl>
          <p className="text-xs text-[var(--admin-mute)]">
            No card/PCI data stored. Est. list prices only.
          </p>
        </div>

        <div className="admin-card p-4 space-y-3">
          <h3 className="font-display text-sm font-bold">Linked accounts</h3>
          {connections.length === 0 && (
            <p className="text-sm text-[var(--admin-mute)]">
              {(profile.connected_socials || []).join(', ') || 'None connected'}
            </p>
          )}
          <ul className="space-y-2">
            {connections.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-[var(--admin-line)] px-3 py-2 text-sm"
              >
                <span className="capitalize">{c.platform}</span>
                <span className="font-mono text-xs text-[var(--admin-mute)]">
                  {new Date(c.connected_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">Activity</h3>
            <span className="font-mono text-[10px] text-[var(--admin-mute)]">
              {meta?.eventCount ?? 0} events
            </span>
          </div>
          <ul className="max-h-72 space-y-2 overflow-auto">
            {events.map((e) => (
              <li
                key={e.id}
                className="border-b border-[var(--admin-line)] pb-2 text-sm last:border-0"
              >
                <div className="font-medium text-[var(--admin-text)]">{e.event_name}</div>
                <div className="font-mono text-[10px] text-[var(--admin-mute)]">
                  {e.event_category || '—'} · {e.page_path || '—'} ·{' '}
                  {new Date(e.created_at).toLocaleString()}
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <li className="text-sm text-[var(--admin-mute)]">No events yet</li>
            )}
          </ul>
        </div>

        <div className="admin-card p-4 space-y-3 lg:col-span-2">
          <h3 className="font-display text-sm font-bold">Script generations · searches · carousels</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <ul className="max-h-48 space-y-2 overflow-auto text-sm">
              <li className="font-mono text-[10px] uppercase text-[var(--admin-mute)]">Scripts</li>
              {scripts.map((s) => (
                <li key={s.id} className="border-b border-[var(--admin-line)] pb-1">
                  {s.topic || '—'} · {s.success ? 'ok' : 'fail'} · score {s.viral_score ?? '—'}
                  <div className="font-mono text-[10px] text-[var(--admin-mute)]">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
              {scripts.length === 0 && (
                <li className="text-[var(--admin-mute)]">No script generations</li>
              )}
            </ul>
            <ul className="max-h-48 space-y-2 overflow-auto text-sm">
              <li className="font-mono text-[10px] uppercase text-[var(--admin-mute)]">Searches</li>
              {searches.map((s) => (
                <li key={s.id} className="border-b border-[var(--admin-line)] pb-1">
                  {s.query}
                  <div className="font-mono text-[10px] text-[var(--admin-mute)]">
                    results {s.result_count ?? '—'} · {new Date(s.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
              {searches.length === 0 && <li className="text-[var(--admin-mute)]">No searches</li>}
            </ul>
            <ul className="max-h-48 space-y-2 overflow-auto text-sm">
              <li className="font-mono text-[10px] uppercase text-[var(--admin-mute)]">Carousels</li>
              {carousels.map((c) => (
                <li key={c.id} className="border-b border-[var(--admin-line)] pb-1">
                  {c.topic || '—'} · {c.exported ? 'exported' : 'draft'}
                  <div className="font-mono text-[10px] text-[var(--admin-mute)]">
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
              {carousels.length === 0 && (
                <li className="text-[var(--admin-mute)]">No carousels</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
