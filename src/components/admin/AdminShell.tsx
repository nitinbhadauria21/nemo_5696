'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

const TITLES: Record<string, { title: string; sub: string }> = {
  '/admin/dashboard': { title: 'Overview', sub: 'Platform health · live' },
  '/admin/users': { title: 'Users', sub: 'Accounts · plans · activity' },
  '/admin/analytics': { title: 'Analytics', sub: 'Growth, funnel & usage' },
  '/admin/revenue': { title: 'Revenue', sub: 'MRR · plan mix · conversions' },
  '/admin/api-keys': { title: 'API Keys', sub: 'Developer keys across users' },
  '/admin/health': { title: 'System', sub: 'Collectors · cron · Supabase' },
  '/admin/keywords': { title: 'Keywords', sub: 'Search intelligence · v2' },
  '/admin/platforms': { title: 'Platforms', sub: 'Usage heatmap · v2' },
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch('/api/admin/me');
        if (cancelled) return;
        if (!res.ok) {
          router.replace('/admin/login');
          return;
        }
        setAllowed(true);
      } catch {
        if (!cancelled) router.replace('/admin/login');
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready || !allowed) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-[var(--admin-bg)] text-[var(--admin-mute)]">
        Checking admin session…
      </div>
    );
  }

  const meta = Object.entries(TITLES).find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`)
  )?.[1] ?? { title: 'Admin', sub: 'Control plane' };

  const isUserDetail = pathname.match(/^\/admin\/users\/[^/]+$/);
  const title = isUserDetail ? 'User profile' : meta.title;
  const sub = isUserDetail ? 'Full account · activity' : meta.sub;

  return (
    <div className="admin-shell flex min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-end justify-between gap-4 border-b border-[var(--admin-line)] px-6 py-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-0.5 text-sm text-[var(--admin-mute)]">{sub}</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--admin-mute)]">
            Live
          </span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
