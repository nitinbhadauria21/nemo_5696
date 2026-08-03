'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NemoWordmark from '@/components/ui/NemoWordmark';

const CONFETTI_COLORS = ['#FF3D00', '#FFB000', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${(index * 7.3) % 100}%`;
  const delay = `${(index * 0.15) % 2}s`;
  const size = index % 3 === 0 ? 10 : index % 3 === 1 ? 8 : 6;
  return (
    <div
      className="absolute top-0 animate-bounce"
      style={{ left, animationDelay: delay, animationDuration: `${1.2 + (index % 5) * 0.2}s` }}
    >
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: index % 2 === 0 ? '50%' : '2px',
          transform: `rotate(${index * 37}deg)`,
        }}
      />
    </div>
  );
}

const UNLOCKED_FEATURES = [
  { emoji: '🔥', label: 'Unlimited Trends', desc: 'Access all trending topics in real-time' },
  { emoji: '🤖', label: 'AI Content Angles', desc: 'Unlimited AI-powered content ideas' },
  { emoji: '📊', label: 'Advanced Analytics', desc: 'Deep insights and performance tracking' },
  { emoji: '📄', label: 'PDF Reports', desc: 'Download weekly trend reports' },
];

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    try {
      const resolved = plan === 'agency' ? 'agency' : 'pro';
      localStorage.setItem('nemo_plan', resolved);
      const raw = localStorage.getItem('nemo_local_session');
      if (raw) {
        const session = JSON.parse(raw);
        session.plan = resolved;
        localStorage.setItem('nemo_local_session', JSON.stringify(session));
      }
    } catch {
      // ignore
    }
  }, [plan]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-4">
      {show && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <NemoWordmark size="md" variant="onLight" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Payment successful
          </h1>
          <p className="text-sm text-muted-foreground font-sans mb-6">
            Your <span className="font-semibold text-foreground uppercase">{plan}</span> plan is now
            active.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            {UNLOCKED_FEATURES.map((f) => (
              <div key={f.label} className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {f.emoji} {f.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="btn-flame flex-1 py-3 rounded-xl text-sm font-bold text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/settings"
              className="flex-1 py-3 rounded-xl text-sm font-bold text-center border border-border bg-card hover:bg-muted"
            >
              Manage Subscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}
