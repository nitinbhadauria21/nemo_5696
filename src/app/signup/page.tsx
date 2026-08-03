import React, { Suspense } from 'react';
import AuthScreen from '../sign-up-login-screen/components/AuthScreen';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <AuthScreen initialMode="signup" />
    </Suspense>
  );
}
