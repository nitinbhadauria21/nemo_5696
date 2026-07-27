'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/admin.css';

export default function AdminLoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (!res.ok) {
      setError('Invalid admin code');
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
            <h1 className="font-display text-xl font-bold">Admin login</h1>
            <p className="text-xs text-[var(--admin-mute)]">Restricted · master code</p>
          </div>
        </div>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Master code"
          className="admin-input"
          autoFocus
        />
        {error && <p className="text-sm text-[var(--admin-bad)]">{error}</p>}
        <button type="submit" disabled={loading} className="admin-btn admin-btn-primary w-full justify-center py-3">
          {loading ? 'Signing in…' : 'Enter admin'}
        </button>
        <Link href="/" className="block text-center text-sm text-[var(--admin-mute)] hover:text-[var(--admin-text)]">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}
