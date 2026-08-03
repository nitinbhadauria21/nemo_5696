import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Nemo',
  description: 'How Nemo collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[#1a1410]">
      <p className="mb-6 text-sm">
        <Link href="/" className="underline underline-offset-2">
          ← Back to Nemo
        </Link>
      </p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mb-6 text-sm text-neutral-600">Last updated: August 2026</p>
      <div className="space-y-4 text-[15px] leading-relaxed text-neutral-800">
        <p>
          Nemo (&quot;we&quot;) provides trend detection and AI content tools. This stub describes
          our intended privacy practices. Replace it with counsel-reviewed language before relying
          on it for production compliance.
        </p>
        <p>
          We collect account details you provide (such as email), product usage data needed to
          operate the service, and payment-related metadata processed by our payment provider. We
          use this information to authenticate you, deliver features, enforce plan limits, improve
          reliability, and meet legal obligations.
        </p>
        <p>
          We do not sell your personal information. Service providers (for example hosting,
          database, analytics, and payments) may process data on our behalf under contractual
          protections.
        </p>
        <p>
          You may request access, correction, or deletion of account data by contacting us at the
          support email published on the site. We retain information only as long as needed to
          provide the service and satisfy legal requirements.
        </p>
        <p>
          Related policies:{' '}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>{' '}
          ·{' '}
          <Link href="/refunds" className="underline underline-offset-2">
            Refunds
          </Link>
        </p>
      </div>
    </main>
  );
}
