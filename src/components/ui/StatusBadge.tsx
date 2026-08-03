import React from 'react';

type Status =
  'hot' | 'rising' | 'fading' | 'RISING' | 'PEAKING' | 'DECLINING' | 'PREDICTED' | 'EXPIRED';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  hot: { label: 'HOT', className: 'status-hot status-hot-glow' },
  rising: { label: 'RISING', className: 'status-rising' },
  fading: { label: 'FADING', className: 'status-fading' },
  RISING: { label: 'RISING', className: 'status-rising' },
  PEAKING: { label: 'PEAKING', className: 'status-hot status-hot-glow' },
  DECLINING: { label: 'DECLINING', className: 'status-fading' },
  PREDICTED: { label: 'PREDICTED', className: 'status-rising' },
  EXPIRED: { label: 'EXPIRED', className: 'status-fading' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.rising;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-mono-custom font-bold uppercase tracking-wider ${sizeClass} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
