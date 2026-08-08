'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Blocks the app shell for unauthenticated users.
 * Relies on middleware for primary protection; this closes the Guest-dashboard
 * hole when cookies exist server-side but the browser session did not hydrate.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, supabaseReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const signedIn = Boolean(user || profile);

  useEffect(() => {
    if (loading) return;
    // Offline demo mode may use a local profile without a Supabase user
    if (!supabaseReady && profile) return;
    if (!signedIn) {
      const next = pathname && pathname !== '/login' ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
    }
  }, [loading, signedIn, supabaseReady, profile, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!signedIn && (supabaseReady || !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}
