import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import TrendDetailContent from './components/TrendDetailContent';

export default function TrendDetailPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading trend…</div>}>
        <TrendDetailContent />
      </Suspense>
    </AppLayout>
  );
}
