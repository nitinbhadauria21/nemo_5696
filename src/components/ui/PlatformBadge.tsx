import React from 'react';
import type { TrendPlatform } from '@/lib/mockData';
import PlatformIcon, { PLATFORM_META, type PlatformId } from '@/components/ui/PlatformIcon';

type Platform = TrendPlatform;

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

const SIZE_CLASS = {
  xs: 'text-[11px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
} as const;

const ICON_SIZE = { xs: 12, sm: 14, md: 16 } as const;

export default function PlatformBadge({
  platform,
  size = 'sm',
  showIcon = true,
}: PlatformBadgeProps) {
  const id = (platform in PLATFORM_META ? platform : 'google') as PlatformId;
  const config = PLATFORM_META[id] ?? {
    label: platform,
    brand: 'var(--muted-foreground)',
    soft: 'var(--muted)',
  };
  const sizeClass = SIZE_CLASS[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-sans font-semibold tracking-tight ${sizeClass}`}
      style={{ color: config.brand, backgroundColor: config.soft }}
    >
      {showIcon && <PlatformIcon platform={id} size={ICON_SIZE[size]} withTile={false} />}
      {config.label === 'Google Trends' ? 'Google' : config.label}
    </span>
  );
}
