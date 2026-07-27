'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Wallet,
  KeyRound,
  HeartPulse,
  Tags,
  Grid3X3,
  LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/revenue', label: 'Revenue', icon: Wallet },
  { href: '/admin/api-keys', label: 'API Keys', icon: KeyRound },
  { href: '/admin/health', label: 'System', icon: HeartPulse },
  { href: '/admin/keywords', label: 'Keywords', icon: Tags },
  { href: '/admin/platforms', label: 'Platforms', icon: Grid3X3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  return (
    <aside className="admin-sidebar flex w-56 shrink-0 flex-col border-r border-[var(--admin-line)] bg-[var(--admin-surface)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--admin-line)] px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF3D0D] to-[#FF8A22] text-sm font-bold text-white">
          N
        </div>
        <div>
          <div className="font-display text-sm font-bold text-[var(--admin-text)]">Nemo Admin</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--admin-mute)]">Control plane</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[rgba(255,90,31,0.15)] text-[#FF6B2B]'
                  : 'text-[var(--admin-soft)] hover:bg-[var(--admin-surface-2)] hover:text-[var(--admin-text)]'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--admin-line)] p-2">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[var(--admin-mute)] transition-colors hover:bg-[var(--admin-surface-2)] hover:text-[var(--admin-text)]"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
