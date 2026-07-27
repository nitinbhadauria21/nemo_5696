import AppLayout from '@/components/AppLayout';

export default function AdminAnalyticsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold mb-2">User Analytics</h1>
        <p className="text-muted-foreground text-sm">Growth, retention, and funnel metrics — wired to admin API in production.</p>
      </div>
    </AppLayout>
  );
}
