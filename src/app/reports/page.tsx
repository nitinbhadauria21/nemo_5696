'use client';

import React from 'react';
import ReportsContent from './components/ReportsContent';
import AppLayout from '@/components/AppLayout';
import TrackPageView from '@/components/TrackPageView';

export default function ReportsPage() {
  return (
    <AppLayout>
      <TrackPageView page="reports" />
      <ReportsContent />
    </AppLayout>
  );
}
