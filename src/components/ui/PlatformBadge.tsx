import React from 'react';
import type { TrendPlatform } from '@/lib/mockData';

type Platform = TrendPlatform;

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'xs' | 'sm' | 'md';
}

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string }> = {
  google: { label: 'Google', color: '#4285F4', bg: 'rgba(66,133,244,0.12)' },
  youtube: { label: 'YouTube', color: '#FF0000', bg: 'rgba(255,0,0,0.10)' },
  instagram: { label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.10)' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', bg: 'rgba(10,102,194,0.10)' },
  tiktok: { label: 'TikTok', color: '#010101', bg: 'rgba(0,0,0,0.08)' },
  twitter: { label: 'X', color: '#1DA1F2', bg: 'rgba(29,161,242,0.12)' },
  reddit: { label: 'Reddit', color: '#FF4500', bg: 'rgba(255,69,0,0.12)' },
};

const SIZE_CLASS = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
} as const;

export default function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform] ?? {
    label: platform,
    color: 'var(--muted-foreground)',
    bg: 'var(--muted)',
  };
  const sizeClass = SIZE_CLASS[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-sans font-medium ${sizeClass}`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  );
}
