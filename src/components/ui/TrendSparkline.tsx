import React from 'react';

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function TrendSparkline({
  data,
  width = 80,
  height = 32,
  color,
  trend = 'up',
}: TrendSparklineProps) {
  if (!data || data.length < 2) return null;

  const strokeColor =
    color || (trend === 'up' ? '#FF5A1F' : trend === 'down' ? '#8B5346' : '#FFB820');
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${strokeColor.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
