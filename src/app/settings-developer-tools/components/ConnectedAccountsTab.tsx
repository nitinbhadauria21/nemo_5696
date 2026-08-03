'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

const PLATFORMS = [
  {
    id: 'ca-google',
    name: 'Google Trends',
    description: 'Real-time trend data · No API key required',
    status: 'live',
    icon: '🔍',
  },
  {
    id: 'ca-youtube',
    name: 'YouTube Data API v3',
    description: 'Video trends & shorts data',
    status: 'needs-key',
    icon: '▶️',
  },
  {
    id: 'ca-instagram',
    name: 'Instagram Graph API',
    description: 'Reels trends & creator signals',
    status: 'needs-key',
    icon: '📸',
  },
  {
    id: 'ca-linkedin',
    name: 'LinkedIn API',
    description: 'Professional content trends',
    status: 'needs-key',
    icon: '💼',
  },
  {
    id: 'ca-tiktok',
    name: 'TikTok API',
    description: 'Short-form video trends · Coming soon',
    status: 'coming-soon',
    icon: '🎵',
  },
];

const STATUS_CONFIG: Record<string, { label: string; badge: string; action: string }> = {
  live: { label: 'Live', badge: 'bg-accent/10 text-accent border-accent/20', action: '' },
  'needs-key': {
    label: 'Connect',
    badge: 'bg-secondary/10 text-secondary border-secondary/20',
    action: 'Add API Key',
  },
  'coming-soon': {
    label: 'Soon',
    badge: 'bg-muted text-muted-foreground border-border',
    action: '',
  },
  're-auth': {
    label: 'Re-auth',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    action: 'Reconnect',
  },
};

export default function ConnectedAccountsTab() {
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [showInput, setShowInput] = useState<string | null>(null);

  const handleConnect = (platformId: string) => {
    // BACKEND INTEGRATION: POST /api/user/connections
    const key = apiKeyInputs[platformId];
    if (!key?.trim()) return;
    toast.success(`API key saved — ${platformId} connected`);
    setShowInput(null);
  };

  return (
    <div className="space-y-4">
      <div className="card-surface p-4 border-secondary/20 bg-secondary/5">
        <p className="text-xs font-sans text-secondary leading-relaxed">
          <span className="font-bold">Platform data is user-provided.</span> Connect your own API
          keys to fetch real-time data from YouTube, Instagram, and LinkedIn. Google Trends runs
          without a key.
        </p>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map((platform) => {
          const statusCfg = STATUS_CONFIG[platform.status];
          return (
            <div key={platform.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <p className="text-sm font-sans font-semibold text-foreground">
                      {platform.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans">
                      {platform.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-mono-custom font-bold px-2.5 py-1 rounded-full border ${statusCfg.badge}`}
                  >
                    {statusCfg.label}
                  </span>
                  {statusCfg.action && (
                    <button
                      onClick={() => setShowInput(showInput === platform.id ? null : platform.id)}
                      className="text-xs font-sans font-semibold text-primary hover:underline"
                    >
                      {statusCfg.action}
                    </button>
                  )}
                </div>
              </div>

              {showInput === platform.id && (
                <div className="mt-3 pt-3 border-t border-border flex gap-2 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Paste your API key here…"
                    value={apiKeyInputs[platform.id] || ''}
                    onChange={(e) =>
                      setApiKeyInputs((prev) => ({ ...prev, [platform.id]: e.target.value }))
                    }
                    className="flex-1 bg-input border border-border rounded-xl px-4 py-2 text-sm font-mono-custom text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={() => handleConnect(platform.id)}
                    className="btn-flame px-4 py-2 text-sm flex-shrink-0"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
