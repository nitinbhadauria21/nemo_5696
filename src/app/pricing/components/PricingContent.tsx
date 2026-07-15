'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceAnnual: 0,
    badge: null,
    description: 'Perfect for getting started with trend discovery.',
    cta: 'Get Started Free',
    ctaHref: '/sign-up-login-screen',
    highlight: false,
    features: [
      { text: 'Up to 3 niches', included: true },
      { text: '2 platform connections', included: true },
      { text: '20 trends/day', included: true },
      { text: 'Basic Nemo Score', included: true },
      { text: 'AI Content Angles (3/day)', included: true },
      { text: 'Viral Script Writer (2/day)', included: true },
      { text: 'Content Queue (10 items)', included: true },
      { text: 'Advanced Analytics', included: false },
      { text: 'PDF Reports', included: false },
      { text: 'Hashtag Intelligence', included: false },
      { text: 'Priority trend alerts', included: false },
      { text: 'API Access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 799,
    priceAnnual: 599,
    badge: 'Most Popular',
    description: 'For serious creators who want to stay ahead of every trend.',
    cta: 'Start Pro Trial',
    ctaHref: '/checkout',
    highlight: true,
    features: [
      { text: 'Unlimited niches', included: true },
      { text: 'All 5 platform connections', included: true },
      { text: 'Unlimited trends', included: true },
      { text: 'Full Nemo Score breakdown', included: true },
      { text: 'AI Content Angles (unlimited)', included: true },
      { text: 'Viral Script Writer (unlimited)', included: true },
      { text: 'Content Queue (unlimited)', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'PDF Reports', included: true },
      { text: 'Hashtag Intelligence', included: true },
      { text: 'Priority trend alerts', included: true },
      { text: 'API Access', included: false },
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 2999,
    priceAnnual: 2399,
    badge: 'Best Value',
    description: 'For agencies and teams managing multiple brands.',
    cta: 'Contact Sales',
    ctaHref: '/checkout',
    highlight: false,
    features: [
      { text: 'Unlimited niches', included: true },
      { text: 'All 5 platform connections', included: true },
      { text: 'Unlimited trends', included: true },
      { text: 'Full Nemo Score breakdown', included: true },
      { text: 'AI Content Angles (unlimited)', included: true },
      { text: 'Viral Script Writer (unlimited)', included: true },
      { text: 'Content Queue (unlimited)', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'PDF Reports', included: true },
      { text: 'Hashtag Intelligence', included: true },
      { text: 'Priority trend alerts', included: true },
      { text: 'API Access', included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: 'Niches', free: '3 max', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Platform Connections', free: '2', pro: '5', agency: '5' },
  { feature: 'Daily Trends', free: '20', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'AI Content Angles', free: '3/day', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Viral Script Writer', free: '2/day', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Content Queue', free: '10 items', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'PDF Reports', free: '—', pro: '✓', agency: '✓' },
  { feature: 'Hashtag Intelligence', free: '—', pro: '✓', agency: '✓' },
  { feature: 'API Access', free: '—', pro: '—', agency: '✓' },
  { feature: 'Priority Support', free: '—', pro: 'Email', agency: 'Dedicated' },
];

const FAQS = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes! Pro comes with a 7-day free trial. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI, all major credit/debit cards, and net banking via Razorpay. GST invoices are provided automatically.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your data is preserved for 30 days after downgrading. You can re-upgrade anytime to restore full access.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes, we offer a 7-day money-back guarantee on all paid plans, no questions asked.',
  },
];

export default function PricingContent() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Dashboard
        </Link>
        <Link href="/sign-up-login-screen" className="text-sm font-sans text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready to go viral.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-6 p-1 bg-muted rounded-full">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                !annual ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                annual ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Annual
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {PLANS?.map((plan) => {
            const price = annual ? plan?.priceAnnual : plan?.price;
            return (
              <div
                key={plan?.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                  plan?.highlight
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border bg-card'
                }`}
              >
                {plan?.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                    plan?.highlight ? 'bg-primary text-white' : 'bg-secondary text-white'
                  }`}>
                    {plan?.badge}
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">{plan?.name}</h3>
                  <p className="text-xs text-muted-foreground font-sans mb-4">{plan?.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-4xl font-bold text-foreground">
                      {price === 0 ? 'Free' : `₹${price?.toLocaleString()}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground font-sans text-sm mb-1">/mo</span>
                    )}
                  </div>
                  {annual && price > 0 && (
                    <p className="text-xs text-green-600 font-sans mt-1">
                      Billed ₹{(price * 12)?.toLocaleString()}/year
                    </p>
                  )}
                </div>
                <Link
                  href={plan?.ctaHref}
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all mb-6 ${
                    plan?.highlight
                      ? 'bg-primary text-white hover:bg-primary/90' :'border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {plan?.cta}
                </Link>
                <ul className="space-y-2.5 flex-1">
                  {plan?.features?.map((f, i) => (
                    <li key={`${plan?.id}-feat-${i}`} className="flex items-center gap-2.5">
                      {f?.included ? (
                        <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <LockClosedIcon className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-sans ${f?.included ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                        {f?.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="mb-14">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-6">
            Full feature comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-muted-foreground font-semibold">Feature</th>
                  <th className="text-center px-5 py-3 text-muted-foreground font-semibold">Free</th>
                  <th className="text-center px-5 py-3 text-primary font-bold">Pro</th>
                  <th className="text-center px-5 py-3 text-muted-foreground font-semibold">Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS?.map((row, i) => (
                  <tr key={`cmp-${i}`} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3 text-foreground font-medium">{row?.feature}</td>
                    <td className="px-5 py-3 text-center text-muted-foreground">{row?.free}</td>
                    <td className="px-5 py-3 text-center text-primary font-semibold">{row?.pro}</td>
                    <td className="px-5 py-3 text-center text-muted-foreground">{row?.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {FAQS?.map((faq, i) => (
              <div key={`faq-${i}`} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-sans font-semibold text-foreground text-sm">{faq?.q}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground font-sans leading-relaxed border-t border-border pt-3">
                    {faq?.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
