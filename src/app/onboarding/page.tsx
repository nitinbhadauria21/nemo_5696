'use client';

import React, { Suspense } from 'react';
import OnboardingWizard from './components/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>}>
      <OnboardingWizard />
    </Suspense>
  );
}
