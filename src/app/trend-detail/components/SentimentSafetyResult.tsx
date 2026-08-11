'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, MessageCircle } from 'lucide-react';
import { LightMarkdown } from './TrendAnalysisResult';

export interface SentimentSafetyData {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  brandSafety: 'safe' | 'caution' | 'risky';
  summary: string;
  risks: string[];
}

interface SentimentSafetyResultProps {
  data: SentimentSafetyData;
  /** When JSON parse failed — render markdown fallback */
  fallbackMarkdown?: string;
}

const SENTIMENT_STYLES: Record<
  SentimentSafetyData['sentiment'],
  { label: string; className: string }
> = {
  positive: {
    label: 'Positive',
    className: 'bg-accent/15 text-accent border-accent/30',
  },
  neutral: {
    label: 'Neutral',
    className: 'bg-muted text-muted-foreground border-border',
  },
  negative: {
    label: 'Negative',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  mixed: {
    label: 'Mixed',
    className: 'bg-secondary/15 text-secondary-foreground border-secondary/30',
  },
};

const SAFETY_STYLES: Record<
  SentimentSafetyData['brandSafety'],
  { label: string; className: string; Icon: React.ElementType }
> = {
  safe: {
    label: 'Brand Safe',
    className: 'bg-accent/15 text-accent border-accent/30',
    Icon: ShieldCheck,
  },
  caution: {
    label: 'Use Caution',
    className: 'bg-secondary/20 text-secondary-foreground border-secondary/40',
    Icon: AlertTriangle,
  },
  risky: {
    label: 'Risky',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
    Icon: ShieldAlert,
  },
};

export function parseSentimentPayload(raw: string): SentimentSafetyData | null {
  const text = (raw || '').trim();
  if (!text) return null;

  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() || text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;

    const sentimentRaw = String(parsed.sentiment || '')
      .toLowerCase()
      .trim();
    const safetyRaw = String(parsed.brandSafety || parsed.brand_safety || '')
      .toLowerCase()
      .trim();

    const sentiment = (['positive', 'neutral', 'negative', 'mixed'] as const).includes(
      sentimentRaw as SentimentSafetyData['sentiment']
    )
      ? (sentimentRaw as SentimentSafetyData['sentiment'])
      : 'neutral';

    const brandSafety = (['safe', 'caution', 'risky'] as const).includes(
      safetyRaw as SentimentSafetyData['brandSafety']
    )
      ? (safetyRaw as SentimentSafetyData['brandSafety'])
      : 'caution';

    const risks = Array.isArray(parsed.risks)
      ? parsed.risks.map((r) => String(r)).filter(Boolean)
      : [];

    return {
      sentiment,
      brandSafety,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      risks,
    };
  } catch {
    return null;
  }
}

export default function SentimentSafetyResult({
  data,
  fallbackMarkdown,
}: SentimentSafetyResultProps) {
  if (fallbackMarkdown && !data.summary && data.risks.length === 0) {
    return (
      <div className="pt-1">
        <LightMarkdown text={fallbackMarkdown} />
      </div>
    );
  }

  const sentiment = SENTIMENT_STYLES[data.sentiment];
  const safety = SAFETY_STYLES[data.brandSafety];
  const SafetyIcon = safety.Icon;

  return (
    <div className="space-y-4 pt-1">
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-sans font-bold px-2.5 py-1 rounded-lg border ${sentiment.className}`}
        >
          <MessageCircle size={12} />
          Sentiment: {sentiment.label}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-sans font-bold px-2.5 py-1 rounded-lg border ${safety.className}`}
        >
          <SafetyIcon size={12} />
          {safety.label}
        </span>
      </div>

      {data.summary ? (
        <p className="text-sm font-sans text-foreground leading-relaxed">{data.summary}</p>
      ) : null}

      {data.risks.length > 0 ? (
        <section>
          <h4 className="font-mono-custom text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Watch-outs
          </h4>
          <ul className="space-y-2">
            {data.risks.map((risk, idx) => (
              <li
                key={`risk-${idx}`}
                className="flex gap-2.5 items-start rounded-xl border border-border bg-card px-3.5 py-2.5"
              >
                <AlertTriangle size={14} className="text-secondary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-sans text-foreground/90 leading-relaxed">{risk}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
