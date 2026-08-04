import React, { useId } from 'react';

export type PlatformId =
  'google' | 'youtube' | 'instagram' | 'linkedin' | 'tiktok' | 'twitter' | 'reddit' | 'all';

export const PLATFORM_META: Record<PlatformId, { label: string; brand: string; soft: string }> = {
  all: { label: 'All', brand: '#FF4500', soft: 'rgba(255,69,0,0.12)' },
  google: { label: 'Google Trends', brand: '#4285F4', soft: 'rgba(66,133,244,0.12)' },
  youtube: { label: 'YouTube', brand: '#FF0000', soft: 'rgba(255,0,0,0.10)' },
  instagram: { label: 'Instagram', brand: '#E1306C', soft: 'rgba(225,48,108,0.12)' },
  linkedin: { label: 'LinkedIn', brand: '#0A66C2', soft: 'rgba(10,102,194,0.12)' },
  tiktok: { label: 'TikTok', brand: '#111111', soft: 'rgba(17,17,17,0.08)' },
  twitter: { label: 'X', brand: '#111111', soft: 'rgba(17,17,17,0.08)' },
  reddit: { label: 'Reddit', brand: '#FF4500', soft: 'rgba(255,69,0,0.12)' },
};

function normalizePlatform(platform: string): PlatformId {
  const p = platform.toLowerCase().replace(/\s+/g, '');
  if (p.includes('youtube')) return 'youtube';
  if (p.includes('instagram')) return 'instagram';
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('tiktok')) return 'tiktok';
  if (p.includes('twitter') || p === 'x') return 'twitter';
  if (p.includes('reddit')) return 'reddit';
  if (p.includes('google')) return 'google';
  if (p === 'all') return 'all';
  return 'google';
}

function Glyph({
  platform,
  size,
  gradientId,
}: {
  platform: PlatformId;
  size: number;
  gradientId: string;
}) {
  const s = size;
  switch (platform) {
    case 'google':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      );
    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#FF0000"
            d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8z"
          />
          <path fill="#fff" d="M9.75 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F58529" />
              <stop offset="45%" stopColor="#DD2A7B" />
              <stop offset="100%" stopColor="#8134AF" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill={`url(#${gradientId})`} />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.15" fill="#fff" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2" />
          <path
            fill="#fff"
            d="M7.1 9.4H4.8V19h2.3V9.4zM5.95 5c-.8 0-1.45.65-1.45 1.45S5.15 7.9 5.95 7.9s1.45-.65 1.45-1.45S6.75 5 5.95 5zM19.2 13.1c0-2.7-1.45-3.95-3.38-3.95-1.56 0-2.26.86-2.65 1.46V9.4h-2.3c.03.66 0 9.6 0 9.6h2.3v-5.36c0-.29.02-.57.11-.78.23-.57.76-1.16 1.65-1.16 1.16 0 1.63.89 1.63 2.19V19h2.3v-5.9z"
          />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#111" />
          <path
            fill="#25F4EE"
            d="M15.9 7.1c-.75-.45-1.3-1.15-1.55-2h-1.85v8.55a2.2 2.2 0 1 1-1.9-2.18v1.9c.17-.03.35-.05.53-.05a1.35 1.35 0 1 0 1.37 1.35V5.1h3.4z"
          />
          <path
            fill="#FE2C55"
            d="M16.75 8.85c-.28.1-.57.17-.85.22v1.75c.7-.08 1.35-.3 1.92-.65v1.9a4.35 4.35 0 0 1-2.72.96v-1.9c.17-.03.34-.05.52-.05.33 0 .65.06.95.17v-2.4z"
            opacity="0.95"
          />
          <path
            fill="#fff"
            d="M15.05 9.07c.28-.05.57-.12.85-.22V7.1c-.75-.45-1.3-1.15-1.55-2h-1.85v8.55a2.2 2.2 0 1 1-1.9-2.18v1.9c.17-.03.35-.05.53-.05a1.35 1.35 0 1 0 1.37 1.35V7.4c.5.55 1.2.95 2.05 1.1.17.04.34.07.5.1v.47z"
          />
        </svg>
      );
    case 'twitter':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#111" />
          <path
            fill="#fff"
            d="M16.6 6h1.7l-3.7 4.25L19 18h-3.5l-2.75-3.58L9.3 18H7.55l4-4.55L7 6h3.55l2.45 3.28L16.6 6zm-.6 10.8h.95L9.95 7.1H8.95l7.05 9.7z"
          />
        </svg>
      );
    case 'reddit':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#FF4500" />
          <circle cx="12" cy="13.2" r="5.2" fill="#fff" />
          <circle cx="9.6" cy="12.6" r="1.05" fill="#111" />
          <circle cx="14.4" cy="12.6" r="1.05" fill="#111" />
          <path
            fill="none"
            stroke="#111"
            strokeWidth="1.1"
            strokeLinecap="round"
            d="M9.4 15.1c.7.7 1.7 1.05 2.6 1.05s1.9-.35 2.6-1.05"
          />
          <circle cx="16.8" cy="9.1" r="1.15" fill="#fff" />
          <path stroke="#fff" strokeWidth="1.3" d="M13.5 8.2l1.5.5 1.6-3.1" />
        </svg>
      );
    case 'all':
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="#FF4500" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="#FF8C00" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="#FFB800" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="#FF4500" opacity="0.7" />
        </svg>
      );
  }
}

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  /** Show soft brand tile behind the mark */
  withTile?: boolean;
  title?: string;
}

/**
 * Premium platform marks for Google / YouTube / Instagram / LinkedIn / etc.
 * Prefer these over emoji or generic Heroicons for platform identity.
 */
export default function PlatformIcon({
  platform,
  size = 22,
  className = '',
  withTile = true,
  title,
}: PlatformIconProps) {
  const reactId = useId();
  const gradientId = `igGrad-${reactId.replace(/:/g, '')}`;
  const id = normalizePlatform(platform);
  const meta = PLATFORM_META[id];
  const glyphSize = withTile ? Math.round(size * 0.62) : size;

  if (!withTile) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        title={title ?? meta.label}
      >
        <Glyph platform={id} size={glyphSize} gradientId={gradientId} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl border border-black/5 dark:border-white/10 shadow-[0_1px_2px_rgba(15,10,5,0.06)] ${className}`}
      style={{
        width: size + 12,
        height: size + 12,
        background: meta.soft,
      }}
      title={title ?? meta.label}
    >
      <Glyph platform={id} size={glyphSize} gradientId={gradientId} />
    </span>
  );
}
