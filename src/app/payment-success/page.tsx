'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

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
        style={{ width: size, height: size, backgroundColor: color, borderRadius: index % 2 === 0 ? '50%' : '2px', transform: `rotate(${index * 37}deg)` }}
      />
    </div>
  );
}

const UNLOCKED_FEATURES = [
  { emoji: '🔥', label: 'Unlimited Trends', desc: 'Access all trending topics in real-time' },
  { emoji: '🤖', label: 'AI Content Angles', desc: 'Unlimited AI-powered content ideas' },
  { emoji: '📊', label: 'Advanced Analytics', desc: 'Deep insights and performance tracking' },
  { emoji: '📄', label: 'PDF Reports', desc: 'Download weekly trend reports' },
  { emoji: '#️⃣', label: 'Hashtag Intelligence', desc: 'Smart hashtag recommendations' },
];

export default function PaymentSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiPiece key={`confetti-${i}`} index={i} />
          ))}
        </div>
      )}

      <div className="w-full max-w-lg">
        {/* Logo */}
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
          {/* Success icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            You're on Pro! 🎉
          </h1>
          <p className="text-muted-foreground font-sans text-sm mb-6">
            Payment successful. Your Pro plan is now active.
          </p>

          {/* Unlocked features */}
          <div className="text-left mb-6">
            <p className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3 text-center">
              Features Unlocked
            </p>
            <div className="space-y-2.5">
              {UNLOCKED_FEATURES.map((f, i) => (
                <div key={`feat-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <span className="text-xl flex-shrink-0">{f.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground font-sans">{f.label}</p>
                    <p className="text-xs text-muted-foreground font-sans">{f.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="block w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all mb-3"
          >
            Go to Dashboard →
          </Link>
          <Link
            href="/settings-developer-tools"
            className="block w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-all"
          >
            Manage Subscription
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5 font-sans">
          A receipt has been sent to your email. Questions?{' '}
          <a href="mailto:support@nemo.app" className="text-primary hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}
