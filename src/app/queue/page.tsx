'use client';

import React from 'react';
import ContentQueueContent from './components/ContentQueueContent';
import AppLayout from '@/components/AppLayout';
import TrackPageView from '@/components/TrackPageView';

export default function QueuePage() {
  return (
    <AppLayout>
      <TrackPageView page="queue" />
      <ContentQueueContent />
    </AppLayout>
  );
}
