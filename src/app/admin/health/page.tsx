import AppLayout from '@/components/AppLayout';

export default function AdminHealthPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold mb-2">System Health</h1>
        <p className="text-muted-foreground text-sm">Collector status, API latency, and OAuth token expiry.</p>
      </div>
    </AppLayout>
  );
}
