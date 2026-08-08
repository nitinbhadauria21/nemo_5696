'use client';

import React, { useState } from 'react';
import { Sparkles, Shield, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { friendlyAiError } from '@/lib/ai/aiClient';

type AnalysisType = 'analysis' | 'sentiment' | 'ideas';

interface AIAnalysisSectionProps {
  type: AnalysisType;
  trendTitle: string;
}

const SECTION_CONFIG: Record<
  AnalysisType,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    accentClass: string;
  }
> = {
  analysis: {
    icon: Sparkles,
    label: 'Trend Analysis',
    description: 'AI breakdown of why this trend is gaining traction',
    accentClass: 'text-primary bg-primary/10 border-primary/20',
  },
  sentiment: {
    icon: Shield,
    label: 'Sentiment & Safety',
    description: 'Brand safety score and audience sentiment analysis',
    accentClass: 'text-accent bg-accent/10 border-accent/20',
  },
  ideas: {
    icon: Lightbulb,
    label: 'Content Ideas',
    description: '5 AI-generated content angles ready to post',
    accentClass: 'text-secondary bg-secondary/10 border-secondary/20',
  },
};

export default function AIAnalysisSection({ type, trendTitle }: AIAnalysisSectionProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isError, setIsError] = useState(false);

  const config = SECTION_CONFIG[type];
  const IconComponent = config.icon;

  const [liveContent, setLiveContent] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setIsError(false);
    const endpoints: Record<AnalysisType, string> = {
      analysis: '/api/trends/analyze',
      sentiment: '/api/trends/sentiment',
      ideas: '/api/trends/generate-ideas',
    };
    try {
      const res = await fetch(endpoints[type], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendTitle }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setLiveContent(friendlyAiError(data.error, res.status));
        setIsError(true);
      } else {
        const text = data.analysis || data.sentiment || data.ideas || 'Analysis unavailable';
        setLiveContent(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
        setIsError(false);
      }
      setIsLoaded(true);
      setIsExpanded(true);
    } catch {
      setLiveContent(friendlyAiError('ai_unavailable', 503));
      setIsError(true);
      setIsLoaded(true);
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`card-surface border ${config.accentClass} overflow-hidden`}>
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => {
          if (isLoaded) setIsExpanded((e) => !e);
          else handleAnalyze();
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.accentClass}`}
          >
            <IconComponent size={16} />
          </div>
          <div className="text-left">
            <p className="text-sm font-sans font-semibold text-foreground">{config.label}</p>
            <p className="text-xs text-muted-foreground font-sans">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLoaded && !isLoading && (
            <span className="text-xs font-sans font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              Run Analysis
            </span>
          )}
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing…
            </div>
          )}
          {isLoaded &&
            (isExpanded ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            ))}
        </div>
      </button>

      {isLoaded && isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="pt-3 border-t border-border">
            {liveContent ? (
              <pre
                className={`text-sm font-sans whitespace-pre-wrap leading-relaxed ${
                  isError ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {liveContent}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No analysis returned.</p>
            )}
            {isError && (
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-primary hover:underline"
                onClick={() => {
                  setIsLoaded(false);
                  setIsExpanded(false);
                  setLiveContent(null);
                  setIsError(false);
                }}
              >
                Dismiss and try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
