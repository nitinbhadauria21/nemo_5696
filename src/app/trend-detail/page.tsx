import React, { Suspense } from 'react';
import TrendDetailRedirect from './TrendDetailRedirect';

export default function TrendDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Redirecting…</div>}>
      <TrendDetailRedirect />
    </Suspense>
  );
}
