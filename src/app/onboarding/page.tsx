'use client';

import React, { Suspense } from 'react';
import OnboardingWizard from './components/OnboardingWizard';
import { useTrackPageView } from '@/lib/analytics/client';

function OnboardingTracked() {
  useTrackPageView('onboarding');
  return <OnboardingWizard />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <OnboardingTracked />
    </Suspense>
  );
}
