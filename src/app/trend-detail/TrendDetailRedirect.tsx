'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TrendDetailRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/trend/${id}`);
    } else {
      router.replace('/dashboard');
    }
  }, [id, router]);

  return <div className="p-8 text-sm text-muted-foreground">Redirecting…</div>;
}
