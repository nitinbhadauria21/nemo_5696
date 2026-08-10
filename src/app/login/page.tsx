'use client';

import React, { Suspense } from 'react';
import AuthScreen from '../sign-up-login-screen/components/AuthScreen';
import TrackPageView from '@/components/TrackPageView';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <TrackPageView page="login" />
      <AuthScreen initialMode="login" />
    </Suspense>
  );
}
