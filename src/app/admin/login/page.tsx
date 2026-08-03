'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/admin.css';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!user) {
      setLoading(false);
      setError('Sign in with your Nemo account first, then open admin login.');
      return;
    }
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setLoading(false);
    if (!res.ok) {
      setError('This account is not an admin. Set profiles.is_admin or ADMIN_EMAIL.');
      return;
    }
    router.push('/admin/dashboard');
    router.refresh();
  };

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="admin-card w-full max-w-sm space-y-4 p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3D0D] to-[#FF8A22] text-sm font-bold text-white">
            N
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Admin access</h1>
            <p className="text-xs text-[var(--admin-mute)]">
              Requires signed-in user with admin role
            </p>
          </div>
        </div>
        {authLoading ? (
          <p className="text-sm text-[var(--admin-mute)]">Checking session…</p>
        ) : user ? (
          <p className="text-sm text-[var(--admin-mute)]">
            Signed in as <span className="text-[var(--admin-text)]">{user.email}</span>
          </p>
        ) : (
          <p className="text-sm text-[var(--admin-bad)]">
            No session.{' '}
            <Link href="/login?next=/admin/login" className="underline">
              Sign in
            </Link>{' '}
            first.
          </p>
        )}
        {error && <p className="text-sm text-[var(--admin-bad)]">{error}</p>}
        <button
          type="submit"
          disabled={loading || authLoading || !user}
          className="admin-btn admin-btn-primary w-full justify-center py-3"
        >
          {loading ? 'Checking…' : 'Enter admin'}
        </button>
        <Link
          href="/"
          className="block text-center text-sm text-[var(--admin-mute)] hover:text-[var(--admin-text)]"
        >
          ← Back to site
        </Link>
      </form>
    </div>
  );
}
