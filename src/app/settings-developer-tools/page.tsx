import React from 'react';
import AppLayout from '@/components/AppLayout';
import SettingsContent from './components/SettingsContent';
import TrackPageView from '@/components/TrackPageView';

export default function SettingsPage() {
  return (
    <AppLayout>
      <TrackPageView page="settings" />
      <SettingsContent />
    </AppLayout>
  );
}