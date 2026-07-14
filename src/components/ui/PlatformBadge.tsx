import React from 'react';

type Platform = 'google' | 'youtube' | 'instagram' | 'linkedin';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md';
}

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string }> = {
  google: { label: 'Google', color: '#4285F4', bg: 'rgba(66,133,244,0.12)' },
  youtube: { label: 'YouTube', color: '#FF0000', bg: 'rgba(255,0,0,0.10)' },
  instagram: { label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.10)' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', bg: 'rgba(10,102,194,0.10)' },
};

export default function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-sans font-medium ${sizeClass}`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  );
}