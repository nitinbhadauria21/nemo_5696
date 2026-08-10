'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import TrackPageView from '@/components/TrackPageView';
import ViralScriptWriterContent from './components/ViralScriptWriterContent';

export default function ViralScriptWriterPage() {
  return (
    <AppLayout>
      <TrackPageView page="viral-script-writer" />
      <ViralScriptWriterContent />
    </AppLayout>
  );
}
