'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import PlatformIcon from '@/components/ui/PlatformIcon';

const SOCIAL_PLATFORMS = [
  { id: 'google', label: 'Google', description: 'Sign in & trend signals' },
  { id: 'youtube', label: 'YouTube', description: 'Shorts & video performance' },
  { id: 'instagram', label: 'Instagram', description: 'Reels & creator metrics' },
  { id: 'linkedin', label: 'LinkedIn', description: 'Professional content trends' },
  { id: 'twitter', label: 'Twitter / X', description: 'Real-time topic signals' },
];

type ConnectionRow = {
  platform: string;
  metadata?: { connected_at?: string; token_status?: string };
};

export default function SocialConnectTab() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/user/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections ?? []);
      }
    } catch {
      // local demo mode
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauth = searchParams.get('oauth');
    if (connected === '1' && oauth) {
      toast.success(`${oauth} connected successfully`);
      loadConnections();
    }
    if (oauth === 'error') {
      toast.error('OAuth connection failed — check provider credentials');
    }
  }, [searchParams, loadConnections]);

  const handleConnect = (platformId: string) => {
    window.location.href = `/api/auth/oauth/${platformId}`;
  };

  const handleDisconnect = async (platformId: string) => {
    const res = await fetch('/api/user/connections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: platformId }),
    });
    if (res.ok) {
      toast.success(`${platformId} disconnected`);
      loadConnections();
    }
  };

  const isConnected = (id: string) => connections.some((c) => c.platform === id);

  return (
    <div className="space-y-4">
      <div className="card-surface p-4 border-primary/20 bg-primary/5">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold">Social Connect</span> links your creator accounts so NEMO
          can personalize trends and track your content performance. OAuth tokens are stored
          server-side only.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading connections…</p>
      ) : (
        <div className="space-y-3">
          {SOCIAL_PLATFORMS.map((platform) => {
            const connected = isConnected(platform.id);
            const meta = connections.find((c) => c.platform === platform.id)?.metadata;
            return (
              <div key={platform.id} className="card-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlatformIcon platform={platform.id} size={22} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground tracking-tight">
                        {platform.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                      {connected && meta?.connected_at && (
                        <p className="text-xs text-accent mt-1">
                          Connected {new Date(meta.connected_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[0.75rem] font-semibold px-2.5 py-1 rounded-full border ${
                        connected
                          ? 'bg-accent/10 text-accent border-accent/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {connected ? 'Connected' : 'Not connected'}
                    </span>
                    {connected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
