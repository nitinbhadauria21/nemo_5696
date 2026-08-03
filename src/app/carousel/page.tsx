'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import CarouselStudio from '@/components/CarouselStudio/CarouselStudio';

function CarouselStudioPageInner() {
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic') ? decodeURIComponent(searchParams.get('topic')!) : '';

  return (
    <AppLayout>
      <div className="flex flex-col h-full min-h-screen bg-background">
        {/* Page header */}
        <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border px-5 sm:px-6 py-3.5 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🎠</span>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-foreground">Carousel Studio</h1>
                <span
                  className="text-xs font-mono-custom font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#0D9488' }}
                >
                  Beta
                </span>
              </div>
              <p className="text-base text-foreground/65 font-sans mt-0.5">
                Create and export branded social media carousels
              </p>
            </div>
          </div>
        </div>

        {/* Studio */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <CarouselStudio initialTopic={topic} />
        </div>
      </div>
    </AppLayout>
  );
}

export default function CarouselStudioPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-foreground/60 font-sans">Loading Carousel Studio…</p>
          </div>
        </AppLayout>
      }
    >
      <CarouselStudioPageInner />
    </Suspense>
  );
}
