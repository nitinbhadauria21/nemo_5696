import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy — Nemo',
  description: 'How refunds work for Nemo subscriptions.',
};

export default function RefundsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[#1a1410]">
      <p className="mb-6 text-sm">
        <Link href="/" className="underline underline-offset-2">
          ← Back to Nemo
        </Link>
      </p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Refund Policy</h1>
      <p className="mb-6 text-sm text-neutral-600">Last updated: August 2026</p>
      <div className="space-y-4 text-[15px] leading-relaxed text-neutral-800">
        <p>
          This stub describes our intended refund practice for paid Nemo plans. Confirm details with
          your payment provider settings and legal counsel before launch.
        </p>
        <p>
          Subscriptions renew according to the interval selected at checkout (monthly or yearly).
          You may cancel future renewals at any time from account settings or by contacting support;
          cancellation stops the next charge but does not automatically refund the current period.
        </p>
        <p>
          If you experience a billing error, duplicate charge, or service outage that prevents
          reasonable use shortly after purchase, contact support within 7 days and we will review a
          refund or credit case-by-case.
        </p>
        <p>
          Refunds, when approved, are returned to the original payment method via our payment
          processor and may take several business days to appear.
        </p>
        <p>
          Related policies:{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>{' '}
          ·{' '}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>
        </p>
      </div>
    </main>
  );
}
