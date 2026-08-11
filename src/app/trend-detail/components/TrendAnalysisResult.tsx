'use client';

import React from 'react';
import { TrendingUp, Target, Layers } from 'lucide-react';

export interface TrendAnalysisData {
  summary?: string;
  whyTrending: string[];
  trajectory?: string;
  bestPlatforms: string[];
}

interface TrendAnalysisResultProps {
  data: TrendAnalysisData;
}

/** Lightweight markdown → React for analysis fallback prose. */
export function LightMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const cls =
        level === 1
          ? 'font-display text-base font-bold text-foreground mt-3 mb-1'
          : level === 2
            ? 'font-sans text-sm font-bold text-foreground mt-3 mb-1'
            : 'font-sans text-sm font-semibold text-foreground/90 mt-2 mb-1';
      nodes.push(
        <p key={`h-${i}`} className={cls}>
          {inlineFormat(heading[2])}
        </p>
      );
      continue;
    }

    const bullet = trimmed.match(/^[-*•]\s+(.+)$/) || trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (bullet) {
      nodes.push(
        <div key={`b-${i}`} className="flex gap-2.5 items-start py-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          <p className="text-sm font-sans text-foreground/90 leading-relaxed">
            {inlineFormat(bullet[1])}
          </p>
        </div>
      );
      continue;
    }

    nodes.push(
      <p key={`p-${i}`} className="text-sm font-sans text-foreground/90 leading-relaxed">
        {inlineFormat(trimmed)}
      </p>
    );
  }

  return <div className="space-y-0.5">{nodes}</div>;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export default function TrendAnalysisResult({ data }: TrendAnalysisResultProps) {
  return (
    <div className="space-y-4 pt-1">
      {data.summary ? (
        <p className="text-sm font-sans text-foreground leading-relaxed border-l-2 border-primary pl-3">
          {data.summary}
        </p>
      ) : null}

      {data.whyTrending.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <TrendingUp size={14} className="text-primary" />
            <h4 className="font-mono-custom text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Why it&apos;s trending
            </h4>
          </div>
          <ul className="space-y-2">
            {data.whyTrending.map((item, idx) => (
              <li
                key={`why-${idx}`}
                className="flex gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5"
              >
                <span className="font-mono-custom text-xs font-bold text-primary tabular-nums pt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-sm font-sans text-foreground leading-relaxed flex-1">{item}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.trajectory ? (
        <section className="rounded-xl border border-secondary/30 bg-secondary/10 px-3.5 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Target size={14} className="text-secondary-foreground" />
            <h4 className="font-mono-custom text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Trajectory (48–72h)
            </h4>
          </div>
          <p className="text-sm font-sans text-foreground leading-relaxed">{data.trajectory}</p>
        </section>
      ) : null}

      {data.bestPlatforms.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Layers size={14} className="text-primary" />
            <h4 className="font-mono-custom text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Best platforms to act on
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.bestPlatforms.map((p) => (
              <span
                key={p}
                className="text-xs font-sans font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20"
              >
                {p}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
