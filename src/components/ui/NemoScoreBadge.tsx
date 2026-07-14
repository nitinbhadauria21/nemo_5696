import React from 'react';

interface NemoScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-primary';
  if (score >= 40) return 'text-secondary';
  return 'text-muted-foreground';
}

export default function NemoScoreBadge({ score, size = 'md' }: NemoScoreBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-2xl';

  return (
    <span
      className={`font-mono-custom font-bold tabular-nums ${sizeClass} ${getScoreColor(score)}`}
    >
      {score}
    </span>
  );
}