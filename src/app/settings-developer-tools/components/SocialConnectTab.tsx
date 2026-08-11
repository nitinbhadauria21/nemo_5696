'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import PlatformIcon from '@/components/ui/PlatformIcon';

const SOCIAL_PLATFORMS = [
  { id: 'google', label: 'Google', description: 'Sign-in profile for personalization' },
  { id: 'youtube', label: 'YouTube', description: 'Your channel insights (not global Trends)' },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Your media insights (not IG Explore Trends)',
  },
  { id: 'linkedin', label: 'LinkedIn', description: 'Your professional profile / pages' },
  { id: 'twitter', label: 'Twitter / X', description: 'Your X account (requires paid API app)' },
];

type ConnectionRow = {
  platform: string;
  status?: string;
  metadata?: { connected_at?: string; token_status?: string; has_refresh?: boolean };
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
      // offline
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
    const reason = searchParams.get('reason');
    if (connected === '1' && oauth) {
      toast.success(`${oauth} connected — tokens stored encrypted on the server`);
      loadConnections();
    }
    if (oauth === 'error') {
      toast.error(
        reason
          ? `Connection failed: ${reason.replace(/_/g, ' ')}`
          : 'OAuth connection failed — check client ID/secret on Vercel'
      );
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

  const isConnected = (id: string) =>
    connections.some((c) => c.platform === id && c.status === 'active');

  return (
    <div className="space-y-4">
      <div className="card-surface p-4 border-primary/20 bg-primary/5">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold">Social Connect</span> links{' '}
          <span className="font-semibold">your own</span> creator accounts for personalization
          (later: your content performance). This is <span className="font-semibold">not</span> how
          Nemo fills the global Trends dashboard.
        </p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Global trending topics come from Nemo&apos;s server collectors (Reddit, YouTube API key,
          Google Trends / SerpAPI, etc.) on a schedule — separate from these logins. OAuth access
          tokens are encrypted at rest and never sent to your browser.
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
                          {meta.has_refresh ? ' · refresh enabled' : ''}
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
                        type="button"
                        onClick={() => handleDisconnect(platform.id)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
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
