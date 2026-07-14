'use client';

import React from 'react';

interface ScoreComponent {
  id: string;
  label: string;
  abbr: string;
  value: number;
  weight: number;
  description: string;
  color: string;
}

/**
 * Score components aligned with the Nemo Backend Data Signals & Trend Scoring Review (v1.0, 14 July 2026).
 *
 * Corrected weights:
 *   Creator Velocity Score: 25% (was 35%)
 *   Spike Score:            30% (was 7%)
 *   Cross-Platform Score:   25% (was 20%) — was missing from original spec, now required
 *   Freshness Score:        20% (was 38%)
 *
 * Final Nemo Score = (CVS×0.25 + SS×0.30 + CPS×0.25 + FSH×0.20) × freshness_multiplier
 */
const SCORE_COMPONENTS: ScoreComponent[] = [
  {
    id: 'sc-ss',
    label: 'Spike Score',
    abbr: 'SS',
    value: 75,
    weight: 30,
    description: 'Log-normalized mention growth vs prior 24h — 10× increase → ~50, 100× → ~75, 1000× → ~100',
    color: 'bg-purple-500',
  },
  {
    id: 'sc-cvs',
    label: 'Creator Velocity Score',
    abbr: 'CVS',
    value: 88,
    weight: 25,
    description: 'Recency-weighted creator adoption: (creators_6h × 4 + creators_24h) / (creators_72h + 1)',
    color: 'bg-primary',
  },
  {
    id: 'sc-cps',
    label: 'Cross-Platform Score',
    abbr: 'CPS',
    value: 62,
    weight: 25,
    description: 'Weighted platform presence — TikTok 22%, Instagram 20%, YouTube 20%, Google 18%, X 12%, Reddit 5%, LinkedIn 3%',
    color: 'bg-secondary',
  },
  {
    id: 'sc-freshness',
    label: 'Freshness Score',
    abbr: 'FSH',
    value: 100,
    weight: 20,
    description: 'Time-decay: 1.0 at detection → 0.67 at 24h → 0.33 at 48h → 0.1 at 72h → expired at 7 days',
    color: 'bg-accent',
  },
];

interface ScoreBreakdownPanelProps {
  finalScore: number;
  creatorVelocityScore?: number;
  spikeScore?: number;
  crossPlatformScore?: number;
  freshnessScore?: number;
  freshnessMultiplier?: number;
}

export default function ScoreBreakdownPanel({
  finalScore,
  creatorVelocityScore,
  spikeScore,
  crossPlatformScore,
  freshnessScore,
  freshnessMultiplier = 1.0,
}: ScoreBreakdownPanelProps) {
  // Use passed-in values if available, otherwise fall back to mock values
  const components = SCORE_COMPONENTS.map((comp) => {
    if (comp.abbr === 'CVS' && creatorVelocityScore !== undefined) return { ...comp, value: creatorVelocityScore };
    if (comp.abbr === 'SS' && spikeScore !== undefined) return { ...comp, value: spikeScore };
    if (comp.abbr === 'CPS' && crossPlatformScore !== undefined) return { ...comp, value: crossPlatformScore };
    if (comp.abbr === 'FSH' && freshnessScore !== undefined) return { ...comp, value: freshnessScore };
    return comp;
  });

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-1">
            NEMO Score Breakdown
          </h3>
          <p className="text-xs text-muted-foreground font-sans">Composite scoring across 4 signals × freshness multiplier</p>
        </div>
        <div className="text-right">
          <div className="font-mono-custom font-bold text-5xl text-primary tabular-nums">
            {finalScore}
          </div>
          <div className="text-xs font-mono-custom text-muted-foreground mt-1">/ 100</div>
        </div>
      </div>

      <div className="space-y-4">
        {components.map((comp) => {
          // All sub-scores are 0–100
          const normalizedPct = Math.min(100, comp.value);
          return (
            <div key={comp.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono-custom font-bold text-foreground">{comp.abbr}</span>
                  <span className="text-xs font-sans text-muted-foreground">{comp.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-custom font-bold text-foreground tabular-nums">
                    {comp.value.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono-custom text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    ×{comp.weight}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${comp.color}`}
                  style={{ width: `${normalizedPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground font-sans mt-1">{comp.description}</p>
            </div>
          );
        })}
      </div>

      {/* Freshness Multiplier */}
      <div className="mt-4 flex items-center justify-between px-3 py-2 bg-muted/50 rounded-xl border border-border/50">
        <span className="text-xs font-mono-custom text-muted-foreground">Freshness Multiplier</span>
        <span className="text-xs font-mono-custom font-bold text-foreground tabular-nums">
          ×{freshnessMultiplier.toFixed(2)}
        </span>
      </div>

      {/* Corrected Formula */}
      <div className="mt-3 p-3 bg-muted rounded-xl">
        <p className="text-xs font-mono-custom text-muted-foreground leading-relaxed">
          <span className="text-foreground font-bold">Formula: </span>
          (CVS×0.25 + SS×0.30 + CPS×0.25 + FSH×0.20) × freshness_multiplier
        </p>
      </div>
    </div>
  );
}