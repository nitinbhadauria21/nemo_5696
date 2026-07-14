'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

const NOTIFICATIONS = [
  { id: 'notif-analysis', label: 'AI Analysis Complete', description: 'Notify when an AI trend analysis finishes running' },
  { id: 'notif-trend', label: 'New Trending Topic', description: 'Alert when a new topic enters HOT status in your niches' },
  { id: 'notif-weekly', label: 'Weekly Performance Report', description: 'Summary of your top trends and content performance every Monday' },
  { id: 'notif-spike', label: 'Spike Alerts', description: 'Instant alert when a trend\'s Spike Score exceeds 4.0' },
  { id: 'notif-account', label: 'Account & Security', description: 'Login from new device, API key usage anomalies' },
];

export default function NotificationsTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    'notif-analysis': true,
    'notif-trend': true,
    'notif-weekly': false,
    'notif-spike': true,
    'notif-account': true,
  });

  const toggle = (id: string) => {
    // BACKEND INTEGRATION: PATCH /api/user/notifications
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
    toast(enabled[id] ? 'Notification disabled' : 'Notification enabled', { icon: enabled[id] ? '🔕' : '🔔' });
  };

  return (
    <div className="space-y-3">
      <div className="card-surface overflow-hidden">
        {NOTIFICATIONS.map((notif, idx) => (
          <div
            key={notif.id}
            className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${
              idx < NOTIFICATIONS.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-sans font-semibold text-foreground">{notif.label}</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">{notif.description}</p>
            </div>

            {/* Custom toggle */}
            <button
              onClick={() => toggle(notif.id)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                enabled[notif.id] ? 'bg-primary' : 'bg-muted border border-border'
              }`}
              role="switch"
              aria-checked={enabled[notif.id]}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  enabled[notif.id] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}