'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import NemoWordmark from '@/components/ui/NemoWordmark';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(
            /\/$/,
            ''
          );
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            // Exchange code via auth callback, then land on the reset form
            redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
          });
          if (resetError) throw resetError;
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <NemoWordmark size="md" variant="onLight" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {!submitted ? (
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
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                  Forgot password?
                </h1>
                <p className="text-sm text-muted-foreground font-sans">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground font-sans mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
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
                Check your inbox
              </h2>
              <p className="text-sm text-muted-foreground font-sans mb-1">
                We sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-foreground font-sans mb-6">{email}</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-primary hover:underline font-sans"
              >
                Didn&apos;t receive it? Try again
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
