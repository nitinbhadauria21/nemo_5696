import React from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];

// Deterministic engagement intensity matrix — higher = better time to post
const HEATMAP_DATA: number[][] = [
  [0.3, 0.5, 0.7, 0.6, 0.8, 0.4],
  [0.4, 0.7, 0.9, 0.8, 0.9, 0.5],
  [0.5, 0.8, 0.95, 0.9, 0.85, 0.6],
  [0.6, 0.85, 1.0, 0.95, 0.9, 0.65],
  [0.5, 0.75, 0.85, 0.8, 0.7, 0.55],
  [0.3, 0.45, 0.55, 0.6, 0.8, 0.7],
  [0.2, 0.35, 0.45, 0.5, 0.75, 0.65],
];

function getHeatColor(intensity: number): string {
  if (intensity >= 0.9) return 'bg-primary opacity-100';
  if (intensity >= 0.75) return 'bg-primary opacity-75';
  if (intensity >= 0.55) return 'bg-secondary opacity-70';
  if (intensity >= 0.35) return 'bg-muted-foreground opacity-30';
  return 'bg-muted opacity-60';
}

export default function BestTimeHeatmap() {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
          Best Time to Post Heatmap
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans text-muted-foreground">Low</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((v, i) => (
              <div
                key={`legend-heat-${i}`}
                className="w-3 h-3 rounded-sm"
                style={{
                  opacity: v,
                  backgroundColor:
                    v >= 0.7
                      ? 'var(--primary)'
                      : v >= 0.4
                        ? 'var(--secondary)'
                        : 'var(--muted-foreground)',
                }}
              />
            ))}
          </div>
          <span className="text-xs font-sans text-muted-foreground">High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[380px]">
          {/* Hour labels */}
          <div className="flex mb-1.5 pl-10">
            {HOURS.map((h) => (
              <div
                key={`hour-${h}`}
                className="flex-1 text-center text-xs font-mono-custom text-muted-foreground"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, di) => (
            <div key={`day-row-${day}`} className="flex items-center gap-1 mb-1">
              <span className="w-8 text-xs font-mono-custom text-muted-foreground flex-shrink-0">
                {day}
              </span>
              {HOURS.map((hour, hi) => {
                const intensity = HEATMAP_DATA[di][hi];
                const isPeak = intensity >= 0.95;
                return (
                  <div
                    key={`cell-${day}-${hour}`}
                    className="flex-1 h-8 rounded heatmap-cell relative group cursor-default"
                    style={{
                      backgroundColor:
                        intensity >= 0.7
                          ? 'var(--primary)'
                          : intensity >= 0.4
                            ? 'var(--secondary)'
                            : 'var(--muted)',
                      opacity: intensity,
                    }}
                  >
                    {isPeak && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-mono-custom font-bold">
                        ★
                      </span>
                    )}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-card border border-border rounded text-xs font-mono-custom text-foreground opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-card">
                      {day} {hour} · {Math.round(intensity * 100)}% engagement
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-xs font-sans text-foreground">
          <span className="font-bold text-primary">Peak window: Thursday 12PM</span> — highest
          engagement across all tracked platforms. Second best: Wednesday 12–3PM.
        </p>
      </div>
    </div>
  );
}
