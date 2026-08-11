'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import PlatformIcon from '@/components/ui/PlatformIcon';

const PLATFORMS = [
  {
    id: 'ca-google',
    platform: 'google',
    name: 'Google Trends',
    description: 'Rising search interest worldwide',
    status: 'live',
  },
  {
    id: 'ca-youtube',
    platform: 'youtube',
    name: 'YouTube',
    description: 'Video and Shorts momentum',
    status: 'live',
  },
  {
    id: 'ca-instagram',
    platform: 'instagram',
    name: 'Instagram',
    description: 'Reels and creator signals',
    status: 'live',
  },
  {
    id: 'ca-linkedin',
    platform: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional conversation trends',
    status: 'unavailable',
  },
  {
    id: 'ca-tiktok',
    platform: 'tiktok',
    name: 'TikTok',
    description: 'Short-form video trends',
    status: 'live',
  },
];

const STATUS_CONFIG: Record<string, { label: string; badge: string; action: string }> = {
  live: { label: 'Live', badge: 'bg-accent/10 text-accent border-accent/20', action: '' },
  unavailable: {
    label: 'Unavailable',
    badge: 'bg-muted text-muted-foreground border-border',
    action: '',
  },
  'needs-key': {
    label: 'Connect',
    badge: 'bg-secondary/10 text-secondary border-secondary/20',
    action: 'Connect',
  },
  'coming-soon': {
    label: 'Coming soon',
    badge: 'bg-muted text-muted-foreground border-border',
    action: '',
  },
};

export default function ConnectedAccountsTab() {
  const [platforms, setPlatforms] = useState(PLATFORMS);

  const handleAction = (id: string, action: string) => {
    if (!action) return;
    toast.message(`${action} — manage connections in Social Connect`);
    setPlatforms((prev) => prev);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Platform coverage for Global Trends. Connect your own accounts under Social Connect for
        personalization.
      </p>
      {platforms.map((p) => {
        const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.live;
        return (
          <div key={p.id} className="card-surface p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <PlatformIcon platform={p.platform} size={22} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-1 rounded-md border ${cfg.badge}`}>{cfg.label}</span>
              {cfg.action ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary"
                  onClick={() => handleAction(p.id, cfg.action)}
                >
                  {cfg.action}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
