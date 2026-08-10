'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Keywords deep-link into the Analytics Keywords section. */
export default function AdminKeywordsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/analytics#keywords');
  }, [router]);

  return (
    <div className="admin-card p-6">
      <h2 className="font-display text-lg font-bold">Keyword Intelligence</h2>
      <p className="mt-2 text-sm text-[var(--admin-mute)]">
        Redirecting to Analytics → Keywords…
      </p>
    </div>
  );
}
