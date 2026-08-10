'use client';

import React from 'react';
import TrackPageView from '@/components/TrackPageView';
import PricingContent from './components/PricingContent';

export default function PricingPage() {
  return (
    <>
      <TrackPageView page="pricing" />
      <PricingContent />
    </>
  );
}
