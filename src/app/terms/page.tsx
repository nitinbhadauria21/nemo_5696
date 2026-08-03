import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Nemo',
  description: 'Terms governing use of the Nemo product.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[#1a1410]">
      <p className="mb-6 text-sm">
        <Link href="/" className="underline underline-offset-2">
          ← Back to Nemo
        </Link>
      </p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mb-6 text-sm text-neutral-600">Last updated: August 2026</p>
      <div className="space-y-4 text-[15px] leading-relaxed text-neutral-800">
        <p>
          By using Nemo you agree to these terms. This is a short operational stub, not a substitute
          for legal review before public commercial launch.
        </p>
        <p>
          Nemo grants you a limited, non-exclusive license to use the product for your own content
          and marketing workflows. You must not abuse the service, attempt unauthorized access,
          scrape at scale in ways that harm the platform, or use outputs for unlawful purposes.
        </p>
        <p>
          AI-generated and trend-related outputs may be incomplete or wrong. You remain responsible
          for reviewing content before publishing and for complying with third-party platform rules.
        </p>
        <p>
          Paid plans, usage limits, and billing intervals are described at checkout and in your
          account. We may suspend accounts that violate these terms or create security risk. The
          service is provided &quot;as is&quot; to the fullest extent permitted by law.
        </p>
        <p>
          Related policies:{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
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
