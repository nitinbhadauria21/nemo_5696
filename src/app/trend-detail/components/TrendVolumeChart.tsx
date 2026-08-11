'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export type ChartPoint = {
  at: string;
  score: number;
  mentions: number;
};

interface VolumeChartProps {
  sparkline?: number[];
  points?: ChartPoint[];
  windowHours?: number;
  velocities?: {
    mention?: number;
    creator?: number;
    score?: number;
    acceleration?: number;
  };
}

function formatTick(iso: string, windowHours: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  if (windowHours <= 12) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
}

export default function TrendVolumeChart({
  sparkline = [],
  points,
  windowHours = 72,
  velocities,
}: VolumeChartProps) {
  const data = useMemo(() => {
    if (points?.length) {
      return points.map((p) => ({
        label: formatTick(p.at, windowHours),
        score: Math.round(p.score * 10) / 10,
        mentions: p.mentions,
      }));
    }
    return sparkline.map((value, i) => ({
      label: `-${Math.max(0, windowHours - i * Math.ceil(windowHours / Math.max(sparkline.length, 1)))}h`,
      score: value,
      mentions: Math.round(value * 1200),
    }));
  }, [points, sparkline, windowHours]);

  const hasSnapshots = Boolean(points?.length);

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
            {hasSnapshots ? `${windowHours}h Score & Mentions` : `${windowHours}h Signal`}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasSnapshots ? 'From stored snapshots' : 'Sparse estimate until more snapshots exist'}
          </p>
        </div>
        {velocities && (
          <div className="text-right text-[0.7rem] font-mono-custom text-muted-foreground space-y-0.5">
            {velocities.score != null && (
              <div>
                Score vel{' '}
                <span className="text-foreground font-bold">{velocities.score.toFixed(2)}x</span>
              </div>
            )}
            {velocities.mention != null && (
              <div>
                Mention vel{' '}
                <span className="text-foreground font-bold">{velocities.mention.toFixed(2)}x</span>
              </div>
            )}
            {velocities.acceleration != null && (
              <div>
                Accel{' '}
                <span className="text-foreground font-bold">
                  {velocities.acceleration >= 0 ? '+' : ''}
                  {velocities.acceleration.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} />
          <YAxis yAxisId="score" tick={{ fontSize: 10 }} domain={[0, 100]} width={32} />
          {hasSnapshots && (
            <YAxis yAxisId="mentions" orientation="right" tick={{ fontSize: 10 }} width={40} />
          )}
          <Tooltip />
          <Legend />
          <Line
            yAxisId="score"
            type="monotone"
            dataKey="score"
            name="Score"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={data.length < 24}
          />
          {hasSnapshots && (
            <Line
              yAxisId="mentions"
              type="monotone"
              dataKey="mentions"
              name="Mentions"
              stroke="var(--secondary, #64748b)"
              strokeWidth={1.5}
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
