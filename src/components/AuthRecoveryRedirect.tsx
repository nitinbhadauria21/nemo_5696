'use client';

import { useEffect } from 'react';

/**
 * Supabase recovery/invite emails sometimes land on Site URL (`/`) with
 * tokens in the URL hash. Forward those to /reset-password so the form can
 * establish a session and update the password.
 */
export default function AuthRecoveryRedirect() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { hash, pathname, search } = window.location;
    if (!hash || hash.length < 2) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const type = params.get('type');
    const hasAccessToken = params.has('access_token');

    const isRecovery =
      type === 'recovery' || type === 'invite' || type === 'magiclink' || hasAccessToken;

    if (!isRecovery) return;
    if (pathname.startsWith('/reset-password') || pathname.startsWith('/auth/callback')) return;

    const next = `/reset-password${search || ''}${hash}`;
    window.location.replace(next);
  }, []);

  return null;
}
