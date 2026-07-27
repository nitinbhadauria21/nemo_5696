'use client';

import Link from 'next/link';
import { memo } from 'react';

type WordmarkSize = 'sm' | 'md' | 'lg';
type WordmarkVariant = 'onFlame' | 'onLight';

const SIZE_MAP: Record<WordmarkSize, { mark: number; markFont: number; word: number; gap: number }> = {
  sm: { mark: 28, markFont: 16, word: 18, gap: 8 },
  md: { mark: 34, markFont: 20, word: 22, gap: 10 },
  lg: { mark: 42, markFont: 26, word: 28, gap: 12 },
};

interface NemoMarkProps {
  size?: number;
  className?: string;
}

/** White monogram tile with gradient "N". */
export const NemoMark = memo(function NemoMark({ size = 34, className = '' }: NemoMarkProps) {
  const fontSize = Math.round(size * 0.62);
  return (
    <div
      className={`nemo-mark flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="nemo-mark-letter leading-none" style={{ fontSize }}>
        N
      </span>
    </div>
  );
});

interface NemoWordmarkProps {
  size?: WordmarkSize;
  variant?: WordmarkVariant;
  href?: string;
  className?: string;
  showBeta?: boolean;
}

const NemoWordmark = memo(function NemoWordmark({
  size = 'md',
  variant = 'onFlame',
  href,
  className = '',
  showBeta = false,
}: NemoWordmarkProps) {
  const s = SIZE_MAP[size];
  const wordColor = variant === 'onFlame' ? 'text-white' : 'text-foreground';

  const content = (
    <div
      className={`inline-flex items-center min-w-0 ${className}`}
      style={{ gap: s.gap }}
    >
      <NemoMark size={s.mark} />
      <span
        className={`font-display font-bold leading-none whitespace-nowrap ${wordColor}`}
        style={{ fontSize: s.word }}
      >
        Nemo<span className="text-black">.</span>
      </span>
      {showBeta && (
        <span className="text-[10px] font-mono-custom font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
          Beta
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
});

export default NemoWordmark;
