'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PLAN_AI_LIMITS } from '@/lib/billing/plans';

const PLAN_COPY: Record<string, { title: string; price: string; badge: string }> = {
  free: { title: 'NEMO Free', price: '₹0 · forever', badge: 'FREE' },
  pro: { title: 'NEMO Pro', price: '₹999/month', badge: 'PRO' },
  agency: { title: 'NEMO Agency', price: '₹4,999/month', badge: 'AGENCY' },
};

export default function SubscriptionTab() {
  const { profile } = useAuth();
  const plan = profile?.plan || 'free';
  const copy = PLAN_COPY[plan] || PLAN_COPY.free;
  const aiUsed = profile?.ai_usage_count ?? 0;
  const aiLimit = PLAN_AI_LIMITS[plan];

  const meters = [
    {
      id: 'usage-ai',
      label: 'AI Analyses',
      used: aiUsed,
      limit: aiLimit >= 10000 ? 10000 : aiLimit,
      unit: 'this period',
    },
    {
      id: 'usage-niches',
      label: 'Niches',
      used: profile?.niches?.length ?? 0,
      limit: plan === 'free' ? 3 : plan === 'pro' ? 10 : 50,
      unit: 'selected',
    },
    {
      id: 'usage-platforms',
      label: 'Platforms',
      used: profile?.platforms?.length ?? 0,
      limit: 5,
      unit: 'selected',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="card-surface p-5 border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-custom font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {copy.badge}
              </span>
              <span className="text-xs font-sans text-muted-foreground">Current Plan</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">{copy.title}</h3>
            <p className="text-sm text-muted-foreground font-sans mt-1">{copy.price}</p>
            {profile?.email && (
              <p className="text-xs text-muted-foreground mt-2 font-mono-custom">{profile.email}</p>
            )}
          </div>
          {plan !== 'agency' && (
            <Link href="/pricing" className="btn-flame px-4 py-2 text-sm">
              {plan === 'free' ? 'Upgrade to Pro' : 'Upgrade to Agency'}
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {meters.map((meter) => {
            const pct = Math.min(100, Math.round((meter.used / Math.max(meter.limit, 1)) * 100));
            const isWarning = pct >= 80;
            return (
              <div key={meter.id} className="bg-muted rounded-xl p-3">
                <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground mb-1">
                  {meter.label}
                </p>
                <p className="font-mono-custom font-bold text-foreground tabular-nums">
                  {meter.used}
                  <span className="text-muted-foreground font-normal text-xs">
                    /{meter.limit >= 10000 ? '∞' : meter.limit}
                  </span>
                </p>
                <div className="h-1.5 bg-border rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWarning ? 'bg-red-400' : 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-1">{meter.unit}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-2">
          Billing history
        </h3>
        <p className="text-sm text-muted-foreground font-sans">
          {plan === 'free'
            ? 'No invoices yet — you are on the free plan.'
            : 'Razorpay settlement sync coming soon. Your plan status above is live from your profile.'}
        </p>
      </div>
    </div>
  );
}
