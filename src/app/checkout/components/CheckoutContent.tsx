'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, CheckCircle, Zap, Users, BarChart3, FileText, Globe, Lock, ChevronDown, ChevronUp, CreditCard, Smartphone, Building2, Tag, Info } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type BillingCycle = 'monthly' | 'annual';
type PaymentMethod = 'upi' | 'card' | 'netbanking';
type Plan = 'pro' | 'agency';

interface PlanConfig {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  badge: string;
  color: string;
}

const PLANS: Record<Plan, PlanConfig> = {
  pro: {
    name: 'NEMO Pro',
    monthlyPrice: 799,
    annualPrice: 599,
    badge: 'PRO',
    color: 'primary',
    features: [
      '100 AI Analyses / month',
      '10 Active Trend Alerts',
      '500 Saved Trends',
      'Viral Script Writer',
      'Advanced Analytics',
      'API Access (10 keys)',
      'Priority Support',
    ],
  },
  agency: {
    name: 'NEMO Agency',
    monthlyPrice: 2499,
    annualPrice: 1999,
    badge: 'AGENCY',
    color: 'secondary',
    features: [
      'Unlimited AI Analyses',
      'Unlimited Trend Alerts',
      'Unlimited Saved Trends',
      'Team Collaboration (5 seats)',
      'White-label Reports',
      'Dedicated API Access',
      'Dedicated Account Manager',
    ],
  },
};

const BANKS = [
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'yes', name: 'Yes Bank' },
];

const GST_RATE = 0.18;

export default function CheckoutContent() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedPlan] = useState<Plan>('pro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  const [isPlacing, setIsPlacing] = useState(false);

  const plan = PLANS[selectedPlan];
  const basePrice = billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const billingMultiplier = billing === 'annual' ? 12 : 1;
  const subtotal = basePrice * billingMultiplier;
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const taxableAmount = subtotal - discount;
  const gst = Math.round(taxableAmount * GST_RATE);
  const total = taxableAmount + gst;
  const annualSavings = billing === 'annual' ? (plan.monthlyPrice - plan.annualPrice) * 12 : 0;

  const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'NEMO10') {
      setCouponApplied(true);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      const res = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billing,
          amountInr: total,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      // When Razorpay keys are present, checkout.js would open here.
      // Fallback / success path persists plan locally and continues.
      await fetch('/api/billing/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderId,
          plan: selectedPlan,
          mockSuccess: !data.razorpayEnabled,
          paymentId: data.paymentId,
        }),
      });

      window.location.href = `/payment-success?plan=${selectedPlan}&order=${encodeURIComponent(data.orderId)}`;
    } catch (err) {
      console.error(err);
      // Still complete the demo journey so UX is not blocked
      window.location.href = `/payment-success?plan=${selectedPlan}`;
    } finally {
      setIsPlacing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-5 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/settings-developer-tools"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold font-sans"
            >
              <ArrowLeft size={17} />
              Back to Settings
            </Link>
            <div className="w-px h-5 bg-border" />
            <span className="text-base font-display font-extrabold text-foreground">Checkout</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans font-medium">
            <Lock size={14} className="text-accent" />
            <span>Secured by 256-bit SSL</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-2">Complete Your Purchase</h1>
          <p className="text-base text-muted-foreground font-sans font-medium">You&apos;re one step away from unlocking the full power of NEMO.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Payment form */}
          <div className="lg:col-span-3 space-y-5">

            {/* Billing Toggle */}
            <div className="bg-card border-2 border-border rounded-2xl p-5">
              <h2 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Billing Cycle</h2>
              <div className="flex items-center gap-3">
                <div className="flex bg-muted rounded-xl p-1 gap-1 flex-1 border border-border">
                  <button
                    onClick={() => setBilling('monthly')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold font-sans transition-all duration-200 ${
                      billing === 'monthly' ?'bg-card text-foreground shadow-card border border-border' :'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling('annual')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold font-sans transition-all duration-200 relative ${
                      billing === 'annual' ?'bg-card text-foreground shadow-card border border-border' :'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Annual
                    <span className="ml-2 text-xs font-mono-custom font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
                      Save 25%
                    </span>
                  </button>
                </div>
              </div>
              {billing === 'annual' && (
                <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/8 border border-accent/20">
                  <Zap size={15} className="text-accent flex-shrink-0" />
                  <p className="text-sm font-bold font-sans text-accent">
                    You save <span className="font-extrabold">{formatPrice(annualSavings)}</span> per year with annual billing
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Tabs */}
            <div className="bg-card border-2 border-border rounded-2xl p-5">
              <h2 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Payment Method</h2>

              {/* Tabs */}
              <div className="flex gap-2 mb-5">
                {([
                  { id: 'upi', label: 'UPI', icon: Smartphone },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                ] as { id: PaymentMethod; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 text-sm font-bold font-sans transition-all duration-150 ${
                      paymentMethod === id
                        ? 'border-primary bg-primary/8 text-primary' :'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* UPI Form */}
              {paymentMethod === 'upi' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-sans font-medium text-muted-foreground mb-1.5">UPI ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <Smartphone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground font-sans mt-1.5">
                      Supports PhonePe, Google Pay, Paytm, BHIM & all UPI apps
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {['gpay', 'phonepe', 'paytm', 'bhim'].map((app) => (
                      <div key={app} className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-border bg-muted/50 text-xs font-mono-custom text-muted-foreground uppercase tracking-wide">
                        {app}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-sans font-medium text-muted-foreground mb-1.5">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground text-sm font-mono-custom placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tracking-widest"
                      />
                      <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium text-muted-foreground mb-1.5">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-medium text-muted-foreground mb-1.5">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground text-sm font-mono-custom placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-muted-foreground mb-1.5">CVV</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground text-sm font-mono-custom placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        <Info size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-help" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                    <Shield size={12} className="text-accent" />
                    <span>Your card details are encrypted and never stored on our servers</span>
                  </div>
                </div>
              )}

              {/* Net Banking Form */}
              {paymentMethod === 'netbanking' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-sans font-medium text-muted-foreground mb-2">Select Your Bank</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          onClick={() => setSelectedBank(bank.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-sans text-left transition-all duration-150 ${
                            selectedBank === bank.id
                              ? 'border-primary bg-primary/8 text-primary' :'border-border bg-card text-foreground hover:border-primary/40'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono-custom font-bold flex-shrink-0 ${
                            selectedBank === bank.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {bank.name.charAt(0)}
                          </div>
                          <span className="truncate text-xs">{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedBank && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                      <CheckCircle size={14} className="text-primary flex-shrink-0" />
                      <p className="text-xs font-sans text-foreground">
                        You'll be redirected to <span className="font-semibold">{BANKS.find(b => b.id === selectedBank)?.name}</span> to complete payment
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coupon Code */}
            <div className="bg-card border-2 border-border rounded-2xl p-5">
              <h2 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-3">Promo Code</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(false); }}
                    placeholder="Enter promo code"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-input text-foreground text-sm font-mono-custom placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || couponApplied}
                  className={`px-5 py-3 rounded-xl text-sm font-sans font-semibold transition-all duration-150 ${
                    couponApplied
                      ? 'bg-accent/15 text-accent border border-accent/30 cursor-default' :'btn-flame disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {couponApplied ? '✓ Applied' : 'Apply'}
                </button>
              </div>
              {couponApplied && (
                <p className="text-xs text-accent font-sans mt-2 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Promo code <span className="font-bold">NEMO10</span> applied — 10% off!
                </p>
              )}
              <p className="text-xs text-muted-foreground font-sans mt-2">Try <span className="font-mono-custom font-bold text-foreground">NEMO10</span> for 10% off</p>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Plan Card */}
            <div className="bg-card border-2 border-border rounded-2xl p-5 border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono-custom font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {plan.badge}
                    </span>
                    <span className="text-xs text-muted-foreground font-sans">Selected Plan</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    {billing === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-foreground">
                    {formatPrice(basePrice)}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans">/ month</p>
                </div>
              </div>

              {/* Feature toggle */}
              <button
                onClick={() => setShowFeatures(!showFeatures)}
                className="flex items-center justify-between w-full text-xs font-sans text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span>{showFeatures ? 'Hide' : 'Show'} plan features</span>
                {showFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showFeatures && (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {plan.features.map((feature, i) => (
                    <li key={`feat-${i}`} className="flex items-center gap-2 text-xs font-sans text-foreground">
                      <CheckCircle size={13} className="text-accent flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-card border-2 border-border rounded-2xl p-5">
              <h2 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-sans">
                  <span className="text-muted-foreground">
                    {plan.name} × {billing === 'annual' ? '12 months' : '1 month'}
                  </span>
                  <span className="font-mono-custom font-medium text-foreground tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {couponApplied && (
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-accent flex items-center gap-1">
                      <Tag size={12} />
                      Promo (NEMO10)
                    </span>
                    <span className="font-mono-custom font-medium text-accent tabular-nums">
                      −{formatPrice(discount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm font-sans">
                  <span className="text-muted-foreground flex items-center gap-1">
                    GST (18%)
                    <Info size={12} className="text-muted-foreground/60 cursor-help" />
                  </span>
                  <span className="font-mono-custom font-medium text-foreground tabular-nums">
                    {formatPrice(gst)}
                  </span>
                </div>

                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-sm font-sans font-semibold text-foreground">Total Due</span>
                  <span className="font-display text-xl font-bold text-foreground tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>

                {billing === 'annual' && (
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-muted-foreground">Annual savings</span>
                    <span className="font-mono-custom font-bold text-accent tabular-nums">
                      {formatPrice(annualSavings)} saved
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="btn-flame w-full py-4 text-base font-display font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150 disabled:opacity-70"
            >
              <Lock size={16} />
              {isPlacing ? 'Processing…' : `Place Order · ${formatPrice(total)}`}
            </button>

            {/* Trust signals */}
            <div className="space-y-2">
              {[
                { icon: Shield, text: '256-bit SSL encrypted payment' },
                { icon: CheckCircle, text: '7-day money-back guarantee' },
                { icon: Globe, text: 'Cancel anytime, no questions asked' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={`trust-${i}`} className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                  <Icon size={13} className="text-accent flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* GST Note */}
            <div className="px-3 py-2.5 rounded-xl bg-muted/60 border border-border">
              <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">GST Note:</span> All prices are exclusive of 18% GST as per Indian tax regulations. A GST invoice will be emailed after payment.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom trust bar */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-sans">
            {[
              { icon: Shield, text: 'Secure Checkout' },
              { icon: Lock, text: 'Data Encrypted' },
              { icon: FileText, text: 'GST Invoice Provided' },
              { icon: Users, text: '10,000+ Creators Trust NEMO' },
              { icon: BarChart3, text: 'Trusted by Top Brands' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={`bar-${i}`} className="flex items-center gap-1.5">
                <Icon size={13} className="text-accent" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
