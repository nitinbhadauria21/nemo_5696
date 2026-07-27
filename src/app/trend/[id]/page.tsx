import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import TrendDetailContent from '@/app/trend-detail/components/TrendDetailContent';

interface TrendPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrendPage({ params }: TrendPageProps) {
  const { id } = await params;
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading trend…</div>}>
        <TrendDetailContent trendId={id} />
      </Suspense>
    </AppLayout>
  );
}
