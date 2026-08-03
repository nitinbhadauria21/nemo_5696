'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import AdminKPICards from './AdminKPICards';
import SystemHealthPanel from './SystemHealthPanel';
import AdminUsersTable from './AdminUsersTable';
import { useAuth } from '@/context/AuthContext';

export default function AdminPanelContent() {
  const { user, loading } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch('/api/admin/me');
        if (!cancelled && res.ok) setAuthenticated(true);
      } catch {
        /* ignore */
      }
    }
    if (user) void check();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAdminEnter = async () => {
    setIsLoading(true);
    setDenied(false);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setDenied(true);
        toast.error('Admin access denied — sign in with an admin account');
        return;
      }
      setAuthenticated(true);
      toast.success('Admin access granted');
    } catch {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="card-surface p-8 border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ShieldAlert size={20} className="text-red-400" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Admin Access</h1>
                <p className="text-xs text-muted-foreground font-sans">
                  Role-based · requires profiles.is_admin or ADMIN_EMAIL
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
              <p className="text-xs font-sans text-red-400 leading-relaxed">
                Sign in to Nemo with your admin user first, then enter the panel. Master codes are
                not used.
              </p>
            </div>

            {!user ? (
              <Link
                href="/login?next=/admin-panel"
                className="block w-full text-center py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-display font-semibold"
              >
                Sign in to continue →
              </Link>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleAdminEnter}
                className="w-full py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-display font-semibold transition-all disabled:opacity-70"
              >
                {isLoading ? 'Verifying…' : 'Enter Admin Panel →'}
              </button>
            )}
            {denied && (
              <p className="mt-3 text-xs text-red-400 text-center">
                This account is not authorized for admin.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
            <ShieldAlert size={14} className="text-red-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Admin Panel</h1>
          <span className="text-xs font-mono-custom bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
            RESTRICTED
          </span>
        </div>
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            setAuthenticated(false);
            toast('Admin session ended');
          }}
          className="text-xs font-sans font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full border border-red-500/20 hover:bg-red-500/10 transition-all"
        >
          Logout
        </button>
      </div>

      <div className="px-6 py-5 max-w-screen-2xl mx-auto space-y-5">
        <AdminKPICards />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <AdminUsersTable />
          </div>
          <div>
            <SystemHealthPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
