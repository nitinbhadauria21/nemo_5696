import React from 'react';


const USAGE_METERS = [
  { id: 'usage-ai', label: 'AI Analyses', used: 47, limit: 100, unit: 'this month' },
  { id: 'usage-alerts', label: 'Trend Alerts', used: 3, limit: 10, unit: 'active' },
  { id: 'usage-saved', label: 'Saved Trends', used: 34, limit: 500, unit: 'bookmarks' },
  { id: 'usage-keys', label: 'API Keys', used: 3, limit: 10, unit: 'active' },
];

const INVOICES = [
  { id: 'inv-001', date: 'Jun 1, 2026', amount: '₹799', status: 'paid', plan: 'Pro Monthly' },
  { id: 'inv-002', date: 'May 1, 2026', amount: '₹799', status: 'paid', plan: 'Pro Monthly' },
  { id: 'inv-003', date: 'Apr 1, 2026', amount: '₹799', status: 'paid', plan: 'Pro Monthly' },
];

export default function SubscriptionTab() {
  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="card-surface p-5 border-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-custom font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                PRO
              </span>
              <span className="text-xs font-sans text-muted-foreground">Current Plan</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">NEMO Pro</h3>
            <p className="text-sm text-muted-foreground font-sans mt-1">₹799/month · Renews Jul 1, 2026</p>
          </div>
          <button className="btn-flame px-4 py-2 text-sm">
            Upgrade to Agency
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {USAGE_METERS?.map((meter) => {
            const pct = Math.round((meter?.used / meter?.limit) * 100);
            const isWarning = pct >= 80;
            return (
              <div key={meter?.id} className="bg-muted rounded-xl p-3">
                <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground mb-1">
                  {meter?.label}
                </p>
                <p className="font-mono-custom font-bold text-foreground tabular-nums">
                  {meter?.used}
                  <span className="text-muted-foreground font-normal text-xs">/{meter?.limit}</span>
                </p>
                <div className="h-1.5 bg-border rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWarning ? 'bg-red-400' : 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-1">{meter?.unit}</p>
              </div>
            );
          })}
        </div>
      </div>
      {/* Invoice history */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
            Invoice History
          </h3>
        </div>
        <div className="divide-y divide-border">
          {INVOICES?.map((inv) => (
            <div key={inv?.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
              <div>
                <p className="text-sm font-sans font-medium text-foreground">{inv?.plan}</p>
                <p className="text-xs text-muted-foreground font-sans">{inv?.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono-custom font-bold text-foreground tabular-nums">{inv?.amount}</span>
                <span className="text-xs font-mono-custom bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                  {inv?.status}
                </span>
                <button className="text-xs font-sans text-primary hover:underline">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}