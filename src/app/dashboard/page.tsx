import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardContent from '../components/DashboardContent';
import TrackPageView from '@/components/TrackPageView';

export default function DashboardPage() {
  return (
    <AppLayout>
      <TrackPageView page="dashboard" />
      <DashboardContent />
    </AppLayout>
  );
}
