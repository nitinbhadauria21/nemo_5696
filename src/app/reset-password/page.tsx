'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import NemoWordmark from '@/components/ui/NemoWordmark';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type SessionState = 'checking' | 'ready' | 'missing';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [sessionState, setSessionState] = useState<SessionState>('checking');

  const isValid = password.length >= 8 && password === confirm;

  useEffect(() => {
    let cancelled = false;

    async function ensureRecoverySession() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setSessionState('missing');
        return;
      }
      const supabase = createClient();
      if (!supabase) {
        if (!cancelled) setSessionState('missing');
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setSessionState(session ? 'ready' : 'missing');
      }
    }

    void ensureRecoverySession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError('');

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Password reset is unavailable. Please try again later.');
      }
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Password reset is unavailable. Please try again later.');
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setSessionState('missing');
        throw new Error('This reset link is invalid or has expired. Request a new one.');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const strength =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500'];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <NemoWordmark size="md" variant="onLight" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {sessionState === 'checking' && !done && (
            <div className="text-center py-6">
              <span className="inline-block w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground font-sans">Verifying reset link…</p>
            </div>
          )}

          {sessionState === 'missing' && !done && (
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Link invalid or expired
              </h1>
              <p className="text-sm text-muted-foreground font-sans mb-6">
                Request a new password reset email, then open the latest link from your inbox.
              </p>
              <Link
                href="/forgot-password"
                className="block w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
              >
                Request new reset link
              </Link>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
                >
                  ← Back to sign in
                </Link>
              </div>
            </div>
          )}

          {sessionState === 'ready' && !done && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                  Set new password
                </h1>
                <p className="text-sm text-muted-foreground font-sans">
                  Choose a strong password for your account. This updates your login in Supabase.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground font-sans mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      autoComplete="new-password"
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={`str-${i}`}
                            className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-muted'}`}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-xs font-sans font-semibold ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : 'text-green-500'}`}
                      >
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground font-sans mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      autoComplete="new-password"
                      className={`w-full px-4 py-3 pr-10 rounded-xl border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                        confirm && password !== confirm
                          ? 'border-red-400 focus:border-red-400'
                          : 'border-border focus:border-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirm ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-500 mt-1 font-sans">
                      Passwords don&apos;t match
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center font-sans" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !isValid}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? 'Updating...' : 'Reset password'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-border text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
                >
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}

          {done && (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                Password updated!
              </h2>
              <p className="text-sm text-muted-foreground font-sans mb-6">
                Your password was saved. Sign in with your new password.
              </p>
              <Link
                href="/login"
                className="block w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
              >
                Sign in with new password
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
