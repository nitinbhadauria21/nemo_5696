'use client';

import React from 'react';
import { Lightbulb, Megaphone } from 'lucide-react';
import { LightMarkdown } from './TrendAnalysisResult';

export interface ContentIdea {
  title: string;
  hook: string;
  format: string;
  cta: string;
}

interface ContentIdeasResultProps {
  ideas: ContentIdea[];
  /** When structured parse failed */
  fallbackMarkdown?: string;
}

const FORMAT_STYLES: Record<string, string> = {
  reel: 'bg-primary/10 text-primary border-primary/25',
  short: 'bg-primary/10 text-primary border-primary/25',
  shorts: 'bg-primary/10 text-primary border-primary/25',
  post: 'bg-accent/10 text-accent border-accent/25',
  carousel: 'bg-secondary/15 text-secondary-foreground border-secondary/30',
  story: 'bg-muted text-muted-foreground border-border',
};

function formatBadgeClass(format: string): string {
  const key = format.toLowerCase().replace(/\s+/g, '');
  return FORMAT_STYLES[key] ?? 'bg-muted text-muted-foreground border-border';
}

export function parseIdeasPayload(raw: string): ContentIdea[] | null {
  const text = (raw || '').trim();
  if (!text) return null;

  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() || text;
    const arrStart = candidate.indexOf('[');
    const objStart = candidate.indexOf('{');

    let parsed: unknown;
    if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
      const end = candidate.lastIndexOf('}');
      if (end <= objStart) return null;
      parsed = JSON.parse(candidate.slice(objStart, end + 1));
    } else if (arrStart !== -1) {
      const end = candidate.lastIndexOf(']');
      if (end <= arrStart) return null;
      parsed = JSON.parse(candidate.slice(arrStart, end + 1));
    } else {
      return null;
    }

    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { ideas?: unknown }).ideas)
        ? (parsed as { ideas: unknown[] }).ideas
        : null;

    if (!list?.length) return null;

    const ideas = list
      .map((item, idx) => {
        if (!item || typeof item !== 'object') return null;
        const o = item as Record<string, unknown>;
        const hook = String(o.hook || o.Hook || '').trim();
        const format = String(o.format || o.Format || 'post').trim();
        const cta = String(o.cta || o.CTA || o.Cta || '').trim();
        const title = String(o.title || o.Title || `Idea ${idx + 1}`).trim();
        if (!hook && !cta) return null;
        return { title, hook: hook || title, format, cta: cta || 'Engage now' };
      })
      .filter(Boolean) as ContentIdea[];

    return ideas.length ? ideas : null;
  } catch {
    return null;
  }
}

/** Parse numbered markdown lists into idea cards when JSON is unavailable. */
export function parseIdeasFromMarkdown(raw: string): ContentIdea[] {
  const blocks = raw.split(/\n(?=\d+[.)]\s)/).filter((b) => b.trim());
  if (blocks.length < 2) return [];

  return blocks.slice(0, 5).map((block, idx) => {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const first = lines[0]?.replace(/^\d+[.)]\s*/, '') || `Idea ${idx + 1}`;
    const hook =
      lines.find((l) => /^hook:/i.test(l))?.replace(/^hook:\s*/i, '') ||
      first.replace(/^(hook|title):\s*/i, '');
    const format = lines.find((l) => /^format:/i.test(l))?.replace(/^format:\s*/i, '') || 'reel';
    const cta = lines.find((l) => /^cta:/i.test(l))?.replace(/^cta:\s*/i, '') || 'Follow for more';
    return { title: `Idea ${idx + 1}`, hook, format, cta };
  });
}

export default function ContentIdeasResult({ ideas, fallbackMarkdown }: ContentIdeasResultProps) {
  if (!ideas.length && fallbackMarkdown) {
    return (
      <div className="pt-1">
        <LightMarkdown text={fallbackMarkdown} />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      {ideas.map((idea, idx) => (
        <article
          key={`idea-${idx}`}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Lightbulb size={13} />
              </span>
              <h4 className="text-sm font-sans font-semibold text-foreground truncate">
                {idea.title}
              </h4>
            </div>
            <span
              className={`text-[10px] font-mono-custom font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex-shrink-0 ${formatBadgeClass(idea.format)}`}
            >
              {idea.format}
            </span>
          </div>
          <div className="px-3.5 py-3 space-y-2.5">
            <div>
              <p className="font-mono-custom text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Hook
              </p>
              <p className="text-sm font-sans text-foreground leading-relaxed">{idea.hook}</p>
            </div>
            <div className="flex gap-2 items-start rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
              <Megaphone size={13} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-mono-custom text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">
                  CTA
                </p>
                <p className="text-sm font-sans text-foreground/90 leading-relaxed">{idea.cta}</p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
