'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Paid checkout / Razorpay is deferred until market launch.
 * Pricing amounts are not shown publicly yet.
 */
export default function CheckoutContent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-5 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold font-sans"
          >
            <ArrowLeft size={17} />
            Back to Plans
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold mb-3">
          Market launch
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
          Paid checkout is not open yet
        </h1>
        <p className="text-muted-foreground font-sans text-base font-medium leading-relaxed mb-8">
          Package prices stay undisclosed until we go live for the market. Razorpay billing will
          launch then. Until that day, use the Free plan and explore the full product.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="btn-flame px-6 py-3 rounded-xl font-bold text-center">
            Continue on Free
          </Link>
          <Link
            href="/pricing"
            className="border-2 border-border px-6 py-3 rounded-xl font-bold text-foreground hover:bg-muted text-center"
          >
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}
