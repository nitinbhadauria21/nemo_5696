import React from 'react';

const SERVICES = [
  { id: 'svc-api', name: 'API Server', status: 'operational', uptime: '99.98%', latency: '42ms' },
  { id: 'svc-db', name: 'MongoDB', status: 'operational', uptime: '99.99%', latency: '8ms' },
  { id: 'svc-trend', name: 'Trend Engine', status: 'operational', uptime: '99.91%', latency: '280ms' },
  { id: 'svc-ai', name: 'Claude AI', status: 'operational', uptime: '99.85%', latency: '1,240ms' },
  { id: 'svc-cdn', name: 'CDN', status: 'degraded', uptime: '98.42%', latency: '180ms' },
];

const STATUS_STYLE: Record<string, { dot: string; label: string; badge: string }> = {
  operational: { dot: 'bg-accent', label: 'Operational', badge: 'bg-accent/10 text-accent' },
  degraded: { dot: 'bg-secondary', label: 'Degraded', badge: 'bg-secondary/10 text-secondary' },
  down: { dot: 'bg-red-500', label: 'Down', badge: 'bg-red-500/10 text-red-400' },
};

export default function SystemHealthPanel() {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
          System Health
        </h3>
        <span className="text-xs font-sans text-muted-foreground">
          Last checked 30s ago
        </span>
      </div>
      <div className="space-y-3">
        {SERVICES.map((svc) => {
          const style = STATUS_STYLE[svc.status];
          return (
            <div key={svc.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${style.dot} ${svc.status === 'operational' ? 'live-pulse' : ''}`} />
                <span className="text-sm font-sans font-medium text-foreground">{svc.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-custom text-muted-foreground tabular-nums">{svc.latency}</span>
                <span className="text-xs font-mono-custom text-muted-foreground tabular-nums">{svc.uptime}</span>
                <span className={`text-xs font-mono-custom font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${style.badge}`}>
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}