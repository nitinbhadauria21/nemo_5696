'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const [email, setEmail] = useState('your@email.com');
  const [cooldown, setCooldown] = useState(0);
  const [expiry, setExpiry] = useState(15 * 60);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const fromSession =
      typeof window !== 'undefined' ? sessionStorage.getItem('nemo_pending_email') : null;
    setEmail(emailParam || fromSession || 'your@email.com');
  }, [emailParam]);

  useEffect(() => {
    const timer = setInterval(() => setExpiry((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleResend = () => {
    setCooldown(60);
    setExpiry(15 * 60);
    setResent(true);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <AppImage
            src="/assets/images/Nemo_Logo_in_LD___1_-1784112484010.png"
            alt="Nemo Logo"
            width={120}
            height={36}
            className="object-contain"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground font-sans mb-1">We sent a verification link to</p>
          <p className="text-sm font-semibold text-foreground font-sans mb-6">{email}</p>

          {expiry > 0 ? (
            <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <span className="text-xs font-sans text-amber-700 font-semibold">
                Link expires in {formatTime(expiry)}
              </span>
            </div>
          ) : (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-xs font-sans text-red-600 font-semibold">
                Link has expired. Please request a new one.
              </span>
            </div>
          )}

          {resent && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
              <p className="text-xs text-green-700 font-sans font-semibold">New verification email sent!</p>
            </div>
          )}

          <button
            onClick={() => {
              window.location.href = '/onboarding';
            }}
            className="w-full py-3 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-all mb-3"
          >
            I&apos;ve verified — continue to onboarding
          </button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </button>

          <p className="text-xs text-muted-foreground font-sans">
            Wrong email?{' '}
            <Link href="/sign-up-login-screen" className="text-primary hover:underline font-semibold">
              Go back and change it
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
