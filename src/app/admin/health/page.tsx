import AppLayout from '@/components/AppLayout';
import SystemHealthPanel from '@/app/admin-panel/components/SystemHealthPanel';

const COLLECTORS = [
  { id: 'google', name: 'Google Trends', status: 'operational', lastRun: '2m ago' },
  { id: 'youtube', name: 'YouTube API', status: 'operational', lastRun: '5m ago' },
  { id: 'reddit', name: 'Reddit API', status: 'degraded', lastRun: '12m ago' },
  { id: 'oauth-google', name: 'Google OAuth', status: 'operational', lastRun: '—' },
  { id: 'oauth-linkedin', name: 'LinkedIn OAuth', status: 'operational', lastRun: '—' },
];

export default function AdminHealthPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">System Health</h1>
          <p className="text-muted-foreground text-sm">Collector status, API latency, and OAuth token health</p>
        </div>

        <SystemHealthPanel />

        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
            Ingestion Collectors
          </h3>
          <div className="space-y-3">
            {COLLECTORS.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-sans font-medium">{c.name}</span>
                <div className="flex items-center gap-3 text-xs font-mono-custom text-muted-foreground">
                  <span>Last run: {c.lastRun}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full uppercase font-bold ${
                      c.status === 'operational'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-secondary/10 text-secondary'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-2">
            Cron Ingestion
          </h3>
          <p className="text-sm text-muted-foreground font-sans">
            Schedule <code className="font-mono-custom text-xs bg-muted px-1.5 py-0.5 rounded">POST /api/trends</code> with header{' '}
            <code className="font-mono-custom text-xs bg-muted px-1.5 py-0.5 rounded">x-cron-secret</code> every 15–30 minutes.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
