'use client';

import AppLayout from '@/components/AppLayout';
import TrackPageView from '@/components/TrackPageView';
import CheckoutContent from './components/CheckoutContent';

export default function CheckoutPage() {
  return (
    <AppLayout>
      <TrackPageView page="checkout" />
      <CheckoutContent />
    </AppLayout>
  );
}
