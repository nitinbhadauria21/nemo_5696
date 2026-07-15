'use client';

import React from 'react';
import ContentQueueContent from './components/ContentQueueContent';
import AppLayout from '@/components/AppLayout';

export default function QueuePage() {
  return (
    <AppLayout>
      <ContentQueueContent />
    </AppLayout>
  );
}
