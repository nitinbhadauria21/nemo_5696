import React, { Suspense } from 'react';
import AuthScreen from './components/AuthScreen';

export default function SignUpLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>}>
      <AuthScreen />
    </Suspense>
  );
}
