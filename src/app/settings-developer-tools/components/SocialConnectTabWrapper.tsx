'use client';

import React, { Suspense } from 'react';
import SocialConnectTab from './SocialConnectTab';

export default function SocialConnectTabWrapper() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <SocialConnectTab />
    </Suspense>
  );
}
