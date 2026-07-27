'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <form onSubmit={submit} className="w-full max-w-sm card-surface p-8 space-y-4">
        <h1 className="font-display text-2xl font-bold">Admin login</h1>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Master code"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="btn-flame w-full py-3 rounded-xl text-sm font-bold">
          {loading ? 'Signing in…' : 'Enter admin'}
        </button>
        <Link href="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}
